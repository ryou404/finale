/**
 * Embedding Service
 * Generates 1536-dimensional vector embeddings via ShopAIKey proxy (OpenAI text-embedding-3-small).
 * Uses native fetch (Node.js 18+) with no external dependencies.
 */

const DEFAULT_BASE_URL = 'https://api.shopaikey.com/v1';
const DEFAULT_MODEL = 'text-embedding-3-small';

/**
 * Get configuration for ShopAIKey
 */
function getConfig() {
  const apiKey = process.env.SHOPAIKEY_API_KEY;
  const baseUrl = (process.env.SHOPAIKEY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const model = process.env.SHOPAIKEY_EMBEDDING_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('Chưa cấu hình SHOPAIKEY_API_KEY trong file .env. Vui lòng thêm API Key để sử dụng tính năng Vector Search/RAG.');
  }

  return { apiKey, baseUrl, model };
}

/**
 * Generate embedding for a single text string
 * @param {string} text
 * @returns {Promise<number[]>} 1536-dim vector
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Nội dung văn bản để tạo embedding không được rỗng.');
  }

  const results = await getBatchEmbeddings([text]);
  return results[0];
}

/**
 * Generate embeddings for multiple texts in batches
 * @param {string[]} texts - Array of text chunks
 * @param {number} batchSize - Number of chunks per request (default: 20)
 * @returns {Promise<number[][]>} Array of 1536-dim vectors
 */
async function getBatchEmbeddings(texts, batchSize = 20) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const { apiKey, baseUrl, model } = getConfig();
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => {
      const clean = (t || '').trim().replace(/\r\n/g, '\n');
      return clean.length > 25000 ? clean.substring(0, 25000) : clean;
    });

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let lastError = null;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        const response = await fetch(`${baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            input: batch
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();

        if (data && data.data) {
          const sorted = data.data.sort((a, b) => a.index - b.index);
          for (const item of sorted) {
            allEmbeddings.push(item.embedding);
          }
          success = true;
        } else {
          throw new Error('Dữ liệu phản hồi từ ShopAIKey embeddings không hợp lệ');
        }
      } catch (err) {
        lastError = err;
        console.error(`[EmbeddingService] Lỗi batch [${i} - ${i + batch.length}] (lần thử ${attempts}/${maxAttempts}): ${err.message}`);

        if (attempts < maxAttempts) {
          await new Promise(res => setTimeout(res, attempts * 1000));
        }
      }
    }

    if (!success) {
      throw new Error(`Không thể tạo vector embedding sau ${maxAttempts} lần thử: ${lastError?.message || 'Lỗi không xác định'}`);
    }
  }

  return allEmbeddings;
}

module.exports = {
  getEmbedding,
  getBatchEmbeddings
};
