/**
 * RAG Search Service
 * Executes semantic vector search against MongoDB Atlas $vectorSearch index.
 * Strictly guarantees multi-tenant data isolation via scope and userId filters.
 */

const { KnowledgeChunk } = require('../db/models/KnowledgeChunk');
const { getEmbedding } = require('./embeddingService');

const INDEX_NAME = process.env.ATLAS_VECTOR_INDEX_NAME || 'vector_index';

/**
 * Perform semantic search for relevant chunks
 * @param {Object} params
 * @param {string} params.query - The user's query text
 * @param {string|null} [params.userId=null] - Authenticated user's ID (if any)
 * @param {number} [params.limit=5] - Number of top chunks to return
 * @param {number} [params.minScore=0.5] - Minimum cosine similarity score threshold
 * @returns {Promise<Array<{ title: string, text: string, score: number, scope: string, docId: string, metadata: Object }>>}
 */
async function searchSimilarChunks({ query, userId = null, limit = 5, minScore = 0.5 }) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }

  // 1. Generate query vector using ShopAIKey
  const queryVector = await getEmbedding(query);
  if (!queryVector || queryVector.length !== 1536) {
    throw new Error('Không thể tạo vector cho câu hỏi truy vấn.');
  }

  // 2. Build multi-tenant filter condition
  let vectorFilter = {};
  if (userId) {
    vectorFilter = {
      $or: [
        { scope: { $eq: 'public' } },
        {
          $and: [
            { scope: { $eq: 'user' } },
            { userId: { $eq: String(userId) } }
          ]
        }
      ]
    };
  } else {
    vectorFilter = {
      scope: { $eq: 'public' }
    };
  }

  // 3. Execute $vectorSearch pipeline in MongoDB Atlas
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: INDEX_NAME,
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: Math.max(limit * 10, 50),
          limit: limit,
          filter: vectorFilter
        }
      },
      {
        $project: {
          _id: 1,
          docId: 1,
          title: 1,
          text: 1,
          scope: 1,
          userId: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await KnowledgeChunk.aggregate(pipeline);

    // Filter by score threshold
    const qualified = results.filter(item => (item.score || 0) >= (minScore || 0.4));

    return qualified.map(item => ({
      docId: item.docId,
      title: item.title,
      text: item.text,
      score: item.score,
      scope: item.scope,
      metadata: item.metadata || {}
    }));
  } catch (atlasErr) {
    console.warn(`[RAG Search] Lưu ý: $vectorSearch (${atlasErr.message}). Chuyển sang tìm kiếm văn bản dự phòng...`);

    // Fallback: regex search on text if vector index is still building or inactive
    const fallbackMatch = {
      $and: [
        userId
          ? {
              $or: [
                { scope: 'public' },
                { scope: 'user', userId: String(userId) }
              ]
            }
          : { scope: 'public' }
      ]
    };

    const keywords = query.trim().split(/\s+/).filter(w => w.length >= 2);
    if (keywords.length > 0) {
      fallbackMatch.$and.push({
        $or: [
          { text: { $regex: keywords.join('|'), $options: 'i' } },
          { title: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      });
    }

    const fallbackResults = await KnowledgeChunk.find(fallbackMatch)
      .limit(limit)
      .select('docId title text scope metadata');

    return fallbackResults.map(item => ({
      docId: item.docId,
      title: item.title,
      text: item.text,
      score: 0.6,
      scope: item.scope,
      metadata: item.metadata || {}
    }));
  }
}

module.exports = {
  searchSimilarChunks
};
