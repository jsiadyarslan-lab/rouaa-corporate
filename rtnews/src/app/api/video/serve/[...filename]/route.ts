// ─── Video Serve API Route (V5) ─────────────────────────────────
// Streams video files from:
//   1. Local disk (persistent or /tmp fallback)
//   2. R2 via S3 API (when local file doesn't exist)
//
// R2 public URLs may expire or become inaccessible, but the S3 API
// (using credentials) always works. This route acts as a proxy
// when the public URL is broken.
//
// Supports Range requests for video seeking.

import { NextRequest, NextResponse } from 'next/server';
import { existsSync, statSync, createReadStream, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { getR2Config, getR2Client } from '@/lib/r2-client';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// Primary video directory — persistent, survives restarts
const VIDEO_DIR_PRIMARY = join(process.cwd(), 'public', 'generated', 'videos');
// Legacy fallback — /tmp directory used by V3
const VIDEO_DIR_FALLBACK = join(tmpdir(), 'roua-videos');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename: filenameParts } = await params;
    const filename = filenameParts.join('/');

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.startsWith('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Look for file in primary directory first, then fallback
    const primaryPath = join(VIDEO_DIR_PRIMARY, filename);
    const fallbackPath = join(VIDEO_DIR_FALLBACK, filename);

    let filePath: string | null = null;

    if (existsSync(primaryPath)) {
      filePath = primaryPath;
    } else if (existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }

    // If local file not found, try to fetch from R2 via S3 API
    if (!filePath) {
      console.log(`[VideoServe] Local file not found: ${filename} — trying R2 S3 API`);
      filePath = await fetchFromR2(filename);
    }

    if (!filePath) {
      console.warn(`[VideoServe] File not found anywhere: ${filename}`);
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
    }

    return streamFile(filePath, request);
  } catch (error: any) {
    console.error('[VideoServe] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Fetch a file from R2 using the S3 API (credentials-based, not public URL)
 * and cache it locally for future requests.
 */
async function fetchFromR2(filename: string): Promise<string | null> {
  const r2Config = getR2Config();
  const r2Client = getR2Client();

  if (!r2Config || !r2Client) {
    console.warn('[VideoServe] R2 not configured — cannot fetch from cloud');
    return null;
  }

  try {
    const r2Key = `videos/${filename}`;
    console.log(`[VideoServe] Fetching from R2: ${r2Key}`);

    const response = await r2Client.send(new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: r2Key,
    }));

    if (!response.Body) {
      console.warn(`[VideoServe] R2 returned empty body for ${r2Key}`);
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    if (stream instanceof Readable || (stream && typeof stream.pipe === 'function')) {
      // Node.js Readable stream
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      if (buffer.length < 1000) {
        console.warn(`[VideoServe] R2 file too small (${buffer.length} bytes) — likely not a real video`);
        return null;
      }

      // Cache the file locally for future requests
      const localPath = join(VIDEO_DIR_PRIMARY, filename);
      try {
        mkdirSync(join(VIDEO_DIR_PRIMARY), { recursive: true });
        writeFileSync(localPath, buffer);
        console.log(`[VideoServe] Cached R2 file locally: ${localPath} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
      } catch (writeErr: any) {
        // Try /tmp fallback if primary dir is not writable
        const tmpPath = join(VIDEO_DIR_FALLBACK, filename);
        try {
          mkdirSync(join(VIDEO_DIR_FALLBACK), { recursive: true });
          writeFileSync(tmpPath, buffer);
          console.log(`[VideoServe] Cached R2 file in /tmp: ${tmpPath}`);
          return tmpPath;
        } catch {}
      }

      return localPath;
    }

    // Web ReadableStream
    const reader = (stream as ReadableStream).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length < 1000) {
      console.warn(`[VideoServe] R2 file too small (${buffer.length} bytes)`);
      return null;
    }

    // Cache locally
    const localPath = join(VIDEO_DIR_PRIMARY, filename);
    try {
      mkdirSync(join(VIDEO_DIR_PRIMARY), { recursive: true });
      writeFileSync(localPath, buffer);
      console.log(`[VideoServe] Cached R2 file locally: ${localPath} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
    } catch {
      const tmpPath = join(VIDEO_DIR_FALLBACK, filename);
      try {
        mkdirSync(join(VIDEO_DIR_FALLBACK), { recursive: true });
        writeFileSync(tmpPath, buffer);
        return tmpPath;
      } catch {}
    }

    return localPath;
  } catch (err: any) {
    console.warn(`[VideoServe] R2 fetch failed: ${err.name || err.message}`);
    return null;
  }
}

function streamFile(filePath: string, request: NextRequest): NextResponse {
  const fileStat = statSync(filePath);
  const fileSize = fileStat.size;

  // Determine content type
  const ext = filePath.split('.').pop()?.toLowerCase();
  const contentType = ext === 'mp4' ? 'video/mp4'
    : ext === 'png' ? 'image/png'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webm' ? 'video/webm'
    : 'application/octet-stream';

  // Handle range requests for video seeking
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Validate range
    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }

    const chunkSize = end - start + 1;

    // Use createReadStream for efficient memory usage
    const readStream = createReadStream(filePath, { start, end });
    const readable = Readable.toWeb(readStream) as ReadableStream;

    return new NextResponse(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Full file response — also use streaming
  const readStream = createReadStream(filePath);
  const readable = Readable.toWeb(readStream) as ReadableStream;

  return new NextResponse(readable, {
    status: 200,
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
