/**
 * Ingestion Service
 * Handles document chunking, text splitting, batch embedding generation,
 * and saving vectors into MongoDB Atlas KnowledgeChunk collection.
 */

const crypto = require('crypto');
const { KnowledgeChunk } = require('../db/models/KnowledgeChunk');
const { getBatchEmbeddings } = require('./embeddingService');

/**
 * Split text into semantic chunks with overlap
 * @param {string} text - Raw document text
 * @param {number} chunkSize - Max characters per chunk (default ~500)
 * @param {number} chunkOverlap - Overlap characters (default ~50)
 * @returns {string[]}
 */
function splitTextIntoChunks(text, chunkSize = 500, chunkOverlap = 50) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length > chunkSize) {
      const sentences = trimmedPara.split(/(?<=[.!?。！？\n])\s+/);
      for (const sent of sentences) {
        if (!sent.trim()) continue;
        if ((currentChunk + ' ' + sent).length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          const overlap = currentChunk.slice(-chunkOverlap);
          currentChunk = overlap + ' ' + sent;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        const overlap = currentChunk.slice(-chunkOverlap);
        currentChunk = overlap + '\n\n' + trimmedPara;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length >= 15);
}

/**
 * Ingest document into MongoDB Atlas vector collection
 * @param {Object} params
 * @param {string} [params.docId] - Custom document ID or generated UUID
 * @param {string} params.title - Document title / filename
 * @param {string} params.content - Plain text or markdown content
 * @param {'public'|'user'} [params.scope='public'] - 'public' or 'user'
 * @param {string|null} [params.userId=null] - Owning user ID
 * @param {Object} [params.metadata={}] - Extra metadata (category, source, tags, etc.)
 */
async function ingestDocument({ docId, title, content, scope = 'public', userId = null, metadata = {} }) {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Nội dung tài liệu không được rỗng.');
  }

  const cleanTitle = (title || 'Tài liệu không tên').trim();
  const documentId = docId || `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  if (scope === 'user' && !userId) {
    throw new Error('Tài liệu thuộc phạm vi cá nhân (scope="user") bắt buộc phải có userId.');
  }

  const rawChunks = splitTextIntoChunks(content, 500, 50);
  if (rawChunks.length === 0) {
    throw new Error('Tài liệu quá ngắn hoặc không trích xuất được đoạn nội dung hợp lệ.');
  }

  console.log(`[Ingestion] Tài liệu "${cleanTitle}" (${documentId}) được chia thành ${rawChunks.length} đoạn.`);

  const embeddings = await getBatchEmbeddings(rawChunks, 20);
  if (embeddings.length !== rawChunks.length) {
    throw new Error(`Số lượng vector embedding (${embeddings.length}) không khớp với số chunk (${rawChunks.length}).`);
  }

  await KnowledgeChunk.deleteMany({ docId: documentId });

  const totalChunks = rawChunks.length;
  const chunkDocs = rawChunks.map((chunkText, idx) => ({
    docId: documentId,
    title: cleanTitle,
    text: chunkText,
    embedding: embeddings[idx],
    scope: scope,
    userId: scope === 'user' ? String(userId) : null,
    metadata: {
      ...metadata,
      chunkIndex: idx,
      totalChunks: totalChunks
    }
  }));

  await KnowledgeChunk.insertMany(chunkDocs);
  console.log(`[Ingestion] Đã lưu thành công ${chunkDocs.length} chunks vào MongoDB Atlas cho docId: ${documentId}`);

  return {
    success: true,
    docId: documentId,
    title: cleanTitle,
    totalChunks: totalChunks,
    scope: scope,
    userId: scope === 'user' ? String(userId) : null
  };
}

/**
 * Delete a document and all its chunks
 * @param {string} docId
 * @param {string} [requestingUserId] - If not admin, verify ownership
 * @param {boolean} [isAdmin=false]
 */
async function deleteDocument(docId, requestingUserId = null, isAdmin = false) {
  if (!docId) throw new Error('Cần cung cấp docId để xóa tài liệu.');

  const filter = { docId: docId };
  if (!isAdmin) {
    if (!requestingUserId) {
      throw new Error('Yêu cầu không có quyền truy cập để xóa tài liệu này.');
    }
    filter.userId = String(requestingUserId);
    filter.scope = 'user';
  }

  const result = await KnowledgeChunk.deleteMany(filter);
  return {
    success: true,
    deletedChunks: result.deletedCount
  };
}

/**
 * List documents summary (aggregated from knowledge_chunks)
 * @param {Object} options
 * @param {'public'|'user'|'all'} [options.scope='all']
 * @param {string} [options.userId=null]
 * @param {number} [options.limit=50]
 */
async function listDocuments({ scope = 'all', userId = null, limit = 50 }) {
  const match = {};
  if (scope === 'public') {
    match.scope = 'public';
  } else if (scope === 'user') {
    match.scope = 'user';
    if (userId) match.userId = String(userId);
  } else if (userId) {
    match.$or = [{ scope: 'public' }, { scope: 'user', userId: String(userId) }];
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$docId',
        title: { $first: '$title' },
        scope: { $first: '$scope' },
        userId: { $first: '$userId' },
        totalChunks: { $sum: 1 },
        metadata: { $first: '$metadata' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $max: '$updatedAt' }
      }
    },
    { $sort: { updatedAt: -1 } },
    { $limit: limit }
  ];

  const docs = await KnowledgeChunk.aggregate(pipeline);
  return docs.map(d => ({
    docId: d._id,
    title: d.title,
    scope: d.scope,
    userId: d.userId,
    totalChunks: d.totalChunks,
    metadata: d.metadata,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  }));
}

module.exports = {
  splitTextIntoChunks,
  ingestDocument,
  deleteDocument,
  listDocuments
};
