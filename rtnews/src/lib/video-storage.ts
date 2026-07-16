// ─── Video Storage Service ───────────────────────────────
// Uploads generated video files to Cloudflare R2 (S3-compatible).
// R2 provides: 10GB free storage, free egress, persistent URLs.
// This is the PERMANENT fix for videos disappearing on Railway redeployment.
//
// Uses the SHARED R2 client from r2-client.ts — the same client
// that image-storage.ts uses successfully (200+ images stored).
// Previously, this module created a separate S3Client that could
// fail silently while image uploads worked fine.

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { getR2Config, getR2Client, isR2Url } from './r2-client';

// Re-export isR2VideoUrl using the shared function
export function isR2VideoUrl(url: string): boolean {
  return isR2Url(url);
}

export interface VideoUploadResult {
  success: boolean;
  url: string;          // R2 public URL or empty string on failure
  storageType: 'r2' | 'local';
  sizeBytes: number;
  error?: string;
}

/**
 * Upload a video file to R2 from a local file path.
 * Reads the file into memory, uploads to R2, and returns the public URL.
 */
export async function uploadVideoToR2(
  videoId: string,
  localFilePath: string,
): Promise<VideoUploadResult> {
  const config = getR2Config();
  const client = getR2Client();

  if (!config || !client) {
    console.error('[VideoStorage] R2 not configured — CANNOT persist video. It will be lost on redeployment!');
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: 0,
      error: 'R2 not configured',
    };
  }

  // Read file from disk
  if (!existsSync(localFilePath)) {
    console.error(`[VideoStorage] Local file not found: ${localFilePath}`);
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: 0,
      error: `Local file not found: ${localFilePath}`,
    };
  }

  const fileBuffer = readFileSync(localFilePath);
  const sizeBytes = fileBuffer.length;
  console.log(`[VideoStorage] Read ${sizeBytes} bytes from ${localFilePath}`);

  return uploadVideoBufferToR2(videoId, fileBuffer, sizeBytes);
}

/**
 * Upload a video buffer directly to R2.
 * Used when the video buffer is already in memory.
 */
export async function uploadVideoBufferToR2(
  videoId: string,
  videoBuffer: Buffer,
  sizeBytes?: number,
): Promise<VideoUploadResult> {
  const config = getR2Config();
  const client = getR2Client();

  if (!config || !client) {
    console.error('[VideoStorage] R2 not configured — CANNOT persist video!');
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: sizeBytes || videoBuffer.length,
      error: 'R2 not configured',
    };
  }

  const actualSize = sizeBytes || videoBuffer.length;
  const key = `videos/${videoId}.mp4`;

  // Upload with retry (3 attempts with longer delays for large files)
  const MAX_RETRIES = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[VideoStorage] Uploading ${videoId}.mp4 to R2 (attempt ${attempt}/${MAX_RETRIES}, ${(actualSize / 1024 / 1024).toFixed(1)} MB)...`);

      await client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: videoBuffer,
        ContentType: 'video/mp4',
        CacheControl: 'public, max-age=31536000', // 1 year — videos are immutable
      }));

      // Build the public URL
      if (!config.publicUrl) {
        console.error('[VideoStorage] R2 upload succeeded but R2_PUBLIC_URL not set — video would be unreachable!');
        return {
          success: false,
          url: '',
          storageType: 'local',
          sizeBytes: actualSize,
          error: 'R2_PUBLIC_URL not configured',
        };
      }

      const url = `${config.publicUrl.replace(/\/$/, '')}/${key}`;
      console.log(`[VideoStorage] ✅ Upload SUCCESS: ${url}`);

      // Verify upload by checking the object exists (HeadObject)
      try {
        const { HeadObjectCommand } = require('@aws-sdk/client-s3');
        await client.send(new HeadObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        }));
        console.log(`[VideoStorage] ✅ Verification: object exists on R2 (${actualSize} bytes)`);
      } catch (verifyErr: any) {
        console.error(`[VideoStorage] ⚠️ Upload reported success but verification FAILED: ${verifyErr.message}`);
        // Don't fail the upload — the object might still be there (eventual consistency)
      }

      return {
        success: true,
        url,
        storageType: 'r2',
        sizeBytes: actualSize,
      };
    } catch (err: any) {
      lastError = err;
      const delay = 2000 * attempt; // 2s, 4s, 6s — longer delays for large files
      console.error(`[VideoStorage] Upload attempt ${attempt}/${MAX_RETRIES} FAILED: ${err.message} — retrying in ${delay}ms`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error(`[VideoStorage] ❌ Upload FAILED after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  return {
    success: false,
    url: '',
    storageType: 'local',
    sizeBytes: actualSize,
    error: lastError?.message,
  };
}

/**
 * Upload a thumbnail image to R2.
 */
export async function uploadThumbnailToR2(
  videoId: string,
  localFilePath: string,
): Promise<VideoUploadResult> {
  const config = getR2Config();
  const client = getR2Client();

  if (!config || !client) {
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: 0,
      error: 'R2 not configured',
    };
  }

  if (!existsSync(localFilePath)) {
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: 0,
      error: `Local file not found: ${localFilePath}`,
    };
  }

  const fileBuffer = readFileSync(localFilePath);
  const key = `videos/${videoId}_thumb.png`;

  try {
    await client.send(new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000',
    }));

    if (!config.publicUrl) {
      return {
        success: false,
        url: '',
        storageType: 'local',
        sizeBytes: fileBuffer.length,
        error: 'R2_PUBLIC_URL not configured',
      };
    }

    const url = `${config.publicUrl.replace(/\/$/, '')}/${key}`;
    console.log(`[VideoStorage] ✅ Thumbnail uploaded: ${url}`);
    return {
      success: true,
      url,
      storageType: 'r2',
      sizeBytes: fileBuffer.length,
    };
  } catch (err: any) {
    console.error(`[VideoStorage] ❌ Thumbnail upload failed: ${err.message}`);
    return {
      success: false,
      url: '',
      storageType: 'local',
      sizeBytes: fileBuffer.length,
      error: err.message,
    };
  }
}

/**
 * Check if R2 is configured and available for video uploads.
 */
export function isR2VideoAvailable(): boolean {
  return !!getR2Config();
}
