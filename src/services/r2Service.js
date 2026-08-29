const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

function cleanEnv(val) {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

const R2_ENDPOINT = cleanEnv(process.env.R2_ENDPOINT);
const R2_ACCESS_KEY_ID = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET_NAME = cleanEnv(process.env.R2_BUCKET_NAME) || 'career';
const R2_PUBLIC_URL = cleanEnv(process.env.R2_PUBLIC_URL);

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.warn('[R2 Storage] Warning: Missing R2 credentials in .env');
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });
  }
  return s3Client;
}

/**
 * Upload a file buffer to Cloudflare R2
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 * @param {string} uid 
 * @param {string} originalName 
 * @returns {Promise<{ key: string, url: string }>}
 */
async function uploadAvatarToR2(fileBuffer, mimeType, uid, originalName = 'avatar.png') {
  const client = getS3Client();
  const ext = (path.extname(originalName) || '.png').toLowerCase();
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const safeUid = (uid || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  const key = `avatars/${safeUid}_${Date.now()}_${randomSuffix}${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || 'image/png',
    CacheControl: 'public, max-age=31536000'
  });

  await client.send(command);

  // If R2_PUBLIC_URL is configured (e.g. https://pub-xxx.r2.dev or custom domain), return direct online URL
  let url = `/api/r2/file/${key}`;
  if (R2_PUBLIC_URL) {
    const baseUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
    url = `${baseUrl}/${key}`;
  }

  return { key, url };
}

/**
 * Retrieve a file from Cloudflare R2
 * @param {string} key 
 * @returns {Promise<{ body: any, contentType: string, contentLength: number }>}
 */
async function getFileFromR2(key) {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key
  });

  const response = await client.send(command);
  return {
    body: response.Body,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength
  };
}

/**
 * Check R2 Bucket connectivity
 */
async function checkR2Status() {
  try {
    const client = getS3Client();
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    return { status: 'ok', bucket: R2_BUCKET_NAME, endpoint: R2_ENDPOINT };
  } catch (err) {
    console.error('[R2 Status Check Failed]:', err.message);
    return { status: 'error', message: err.message };
  }
}

module.exports = {
  uploadAvatarToR2,
  getFileFromR2,
  checkR2Status,
  R2_BUCKET_NAME
};
