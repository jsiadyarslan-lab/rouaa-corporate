// ─── Shared R2 Client Singleton ───────────────────────────────
// Both image-storage.ts and video-storage.ts use this shared client.
// This ensures that if R2 works for images, it works for videos too.
// Previously, video-storage created a separate S3Client that could
// fail silently while image-storage's client worked fine.

import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

// Shared singleton — ONE client for the entire app
let sharedR2Client: S3Client | null = null;
let sharedR2Config: R2Config | null = null;
let configChecked = false;

export function getR2Config(): R2Config | null {
  if (configChecked) return sharedR2Config;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn('[R2Client] R2 not configured — missing one or more env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
    configChecked = true;
    return null;
  }

  sharedR2Config = { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
  configChecked = true;
  console.log(`[R2Client] R2 configured — bucket: ${bucketName}, publicUrl: ${publicUrl ? publicUrl.slice(0, 50) + '...' : '(not set)'}`);
  return sharedR2Config;
}

export function getR2Client(): S3Client | null {
  if (sharedR2Client) return sharedR2Client;

  const config = getR2Config();
  if (!config) return null;

  sharedR2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Proper request handler with extended timeout for large video uploads (5 minutes)
    // Previously used a plain object `{ requestTimeout } as any` which was INVALID
    // and caused silent failures on large video uploads.
    requestHandler: new NodeHttpHandler({
      requestTimeout: 300000,  // 5 minutes — needed for 5-30MB video uploads
      connectionTimeout: 30000, // 30 seconds to establish connection
    }),
  });

  console.log('[R2Client] Shared S3Client initialized');
  return sharedR2Client;
}

/**
 * Check if a URL is an R2 URL (persistent, CDN-backed).
 */
export function isR2Url(url: string): boolean {
  if (!url.startsWith('https://')) return false;
  if (url.includes('.r2.dev/')) return true;
  if (url.includes('.r2.cloudflarestorage.com/')) return true;
  const configuredPublicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (configuredPublicUrl && url.startsWith(configuredPublicUrl + '/')) return true;
  return false;
}
