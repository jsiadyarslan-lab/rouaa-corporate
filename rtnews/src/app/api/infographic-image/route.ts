// ─── Infographic Image Server V4 ──────────────────────────────
// GET /api/infographic-image?path=slide-hero-1-abc.png
// Serves AI-generated infographic images from /tmp/rouaa-infographics/
// V4: Auto-generates missing images on-demand (for Railway redeployment)

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = '/tmp/rouaa-infographics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const imagePath = request.nextUrl.searchParams.get('path');

  if (!imagePath) {
    return NextResponse.json({ error: 'path parameter required' }, { status: 400 });
  }

  // Security: prevent directory traversal
  const basename = path.basename(imagePath);
  if (basename !== imagePath || imagePath.includes('..') || imagePath.includes('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const fullPath = path.resolve(IMAGE_DIR, basename);

  try {
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const contentType = basename.endsWith('.png') ? 'image/png'
        : basename.endsWith('.jpg') || basename.endsWith('.jpeg') ? 'image/jpeg'
        : basename.endsWith('.webp') ? 'image/webp'
        : 'application/octet-stream';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': String(buffer.length),
        },
      });
    }

    // File not found in /tmp — this is expected after Railway redeployment
    // The client-side auto-regeneration (InfographicDetailClient V16) will trigger
    // image generation and reload the page when images are ready.
    console.warn(`[InfographicImage] File not found: ${basename} — client will trigger regeneration`);

    // Return a transparent 1x1 PNG placeholder so the UI doesn't break
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Length': String(transparentPng.length),
        'X-Image-Missing': 'true',
      },
    });
  } catch (err: any) {
    console.error(`[InfographicImage] Error reading ${fullPath}: ${err.message}`);
    return new NextResponse(JSON.stringify({ error: 'Failed to read image' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }
}
