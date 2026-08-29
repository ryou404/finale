const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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
 * Generic file upload to Cloudflare R2
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 * @param {string} folder - 'documents', 'resources', 'avatars', etc.
 * @param {string} originalName 
 * @param {string} uploaderUid 
 * @returns {Promise<{ key: string, url: string, size: number, originalName: string }>}
 */
async function uploadFileToR2(fileBuffer, mimeType, folder = 'documents', originalName = 'file.bin', uploaderUid = 'admin') {
  const client = getS3Client();
  const ext = (path.extname(originalName) || '').toLowerCase();
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_').substring(0, 30);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const safeFolder = (folder || 'documents').replace(/[^a-zA-Z0-9_-]/g, '');
  const key = `${safeFolder}/${baseName}_${Date.now()}_${randomSuffix}${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || 'application/octet-stream',
    CacheControl: 'public, max-age=31536000'
  });

  await client.send(command);

  let url = `/api/r2/file/${key}`;
  if (R2_PUBLIC_URL) {
    const baseUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
    url = `${baseUrl}/${key}`;
  }

  return {
    key,
    url,
    size: fileBuffer.length,
    originalName,
    mimeType: mimeType || 'application/octet-stream'
  };
}

/**
 * Upload an avatar file to Cloudflare R2 (Dedicated)
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 * @param {string} uid 
 * @param {string} originalName 
 * @returns {Promise<{ key: string, url: string }>}
 */
async function uploadAvatarToR2(fileBuffer, mimeType, uid, originalName = 'avatar.png') {
  return await uploadFileToR2(fileBuffer, mimeType, 'avatars', originalName, uid);
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
 * Delete a file from Cloudflare R2 by key
 * @param {string} key 
 */
async function deleteFileFromR2(key) {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });
    await client.send(command);
    return { status: 'ok', key };
  } catch (err) {
    console.error(`[R2 deleteFileFromR2 error for ${key}]:`, err);
    throw err;
  }
}

/**
 * List files in R2 Bucket
 * @param {string} prefix 
 * @param {number} maxKeys 
 */
async function listFilesFromR2(prefix = '', maxKeys = 100) {
  try {
    const client = getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys
    });
    const response = await client.send(command);
    return {
      status: 'ok',
      contents: (response.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${item.Key}` : `/api/r2/file/${item.Key}`
      }))
    };
  } catch (err) {
    console.error('[R2 listFilesFromR2 error]:', err);
    return { status: 'error', message: err.message, contents: [] };
  }
}

/**
 * Check R2 Bucket connectivity
 */
async function checkR2Status() {
  try {
    const client = getS3Client();
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    return { 
      status: 'ok', 
      bucket: R2_BUCKET_NAME, 
      endpoint: R2_ENDPOINT,
      publicUrl: R2_PUBLIC_URL 
    };
  } catch (err) {
    console.error('[R2 Status Check Failed]:', err.message);
    return { status: 'error', message: err.message };
  }
}

module.exports = {
  uploadFileToR2,
  uploadAvatarToR2,
  getFileFromR2,
  deleteFileFromR2,
  listFilesFromR2,
  checkR2Status,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL
};
