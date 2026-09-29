/**
 * RAG Chat & Knowledge Routes (/api/rag)
 * Endpoints for AI Chatbot, Vector Semantic Search, Document Ingestion & Document Management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

const { processRagChat } = require('../services/ragChatService');
const { searchSimilarChunks } = require('../services/ragSearchService');
const { ingestDocument, deleteDocument, listDocuments } = require('../services/ingestionService');
const { User } = require('../db/models/User');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for docs
});

/**
 * 1. AI RAG Chat Endpoint (Main chatbot endpoint)
 * POST /api/rag/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], currentPage = '', userInfo = null } = req.body || {};
    const userId = req.headers['x-user-id'] || req.body?.userId || userInfo?.uid || userInfo?.id || null;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Danh sách tin nhắn (messages) không được rỗng.'
      });
    }

    const result = await processRagChat({
      messages,
      userId,
      currentPage,
      userInfo
    });

    res.json(result);
  } catch (err) {
    console.error('[API /api/rag/chat Error]:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi xử lý phản hồi RAG: ' + err.message
    });
  }
});

/**
 * 2. Semantic Vector Search Endpoint (Standalone testing / preview)
 * POST /api/rag/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 5, minScore = 0.5 } = req.body || {};
    const userId = req.headers['x-user-id'] || req.body?.userId || null;

    if (!query) {
      return res.status(400).json({ status: 'error', message: 'Cần nhập nội dung truy vấn (query).' });
    }

    const results = await searchSimilarChunks({
      query,
      userId,
      limit: Number(limit) || 5,
      minScore: Number(minScore) || 0.5
    });

    res.json({
      status: 'ok',
      count: results.length,
      results
    });
  } catch (err) {
    console.error('[API /api/rag/search Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. Text Ingestion Endpoint (Admin for Public, Users for their own docs)
 * POST /api/rag/ingest
 */
router.post('/ingest', async (req, res) => {
  try {
    const { docId, title, content, scope = 'public', metadata = {} } = req.body || {};
    const adminUid = req.headers['x-admin-uid'] || req.body?.admin_uid;
    const requestUserId = req.headers['x-user-id'] || req.body?.userId;

    let finalScope = scope;
    let targetUserId = null;

    if (finalScope === 'public') {
      if (!adminUid) {
        return res.status(403).json({
          status: 'error',
          message: '僅系統管理員 (Admin) 有權新增公用知識庫文件。/ Only administrators can add public knowledge base documents.'
        });
      }
      const adminUser = await User.findOne({
        $or: [{ uid: adminUid }, { username: adminUid }],
        role: 'admin',
        isActive: { $ne: false }
      });
      if (!adminUser) {
        return res.status(403).json({ status: 'error', message: '權限不足：需要系統管理員權限。/ Admin privileges required.' });
      }
    } else {
      if (!requestUserId) {
        return res.status(401).json({ status: 'error', message: '請先登入以管理個人專屬文件。/ Please login to upload private documents.' });
      }
      targetUserId = String(requestUserId);
    }

    const result = await ingestDocument({
      docId,
      title,
      content,
      scope: finalScope,
      userId: targetUserId,
      metadata
    });

    res.json({
      status: 'ok',
      message: `成功導入文件 "${result.title}" 至向量資料庫。/ Document "${result.title}" successfully ingested.`,
      data: result
    });
  } catch (err) {
    console.error('[API /api/rag/ingest Error]:', err);
    res.status(500).json({ status: 'error', message: '文檔導入失敗 / Ingestion error: ' + err.message });
  }
});

/**
 * 4. File Upload Ingestion (supports .txt, .md, .json)
 * POST /api/rag/upload-file
 */
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '請選擇欲上傳之文件檔案。/ Please select a file to upload.' });
    }

    const { scope = 'public', title } = req.body || {};
    const adminUid = req.headers['x-admin-uid'] || req.body?.admin_uid;
    const requestUserId = req.headers['x-user-id'] || req.body?.userId;

    let finalScope = scope;
    let targetUserId = null;

    if (finalScope === 'public') {
      if (!adminUid) {
        return res.status(403).json({ status: 'error', message: '僅管理員可上傳公用知識庫文件。/ Only admin can upload public documents.' });
      }
    } else {
      if (!requestUserId) {
        return res.status(401).json({ status: 'error', message: '請先登入以管理個人專屬文件。/ Please login to upload private documents.' });
      }
      targetUserId = String(requestUserId);
    }

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const content = req.file.buffer.toString('utf8');

    const result = await ingestDocument({
      title: title || originalName,
      content: content,
      scope: finalScope,
      userId: targetUserId,
      metadata: {
        originalFileName: originalName,
        source: 'file_upload',
        fileSize: req.file.size
      }
    });

    res.json({
      status: 'ok',
      message: `成功導入檔案 "${result.title}"。/ File "${result.title}" successfully ingested.`,
      data: result
    });
  } catch (err) {
    console.error('[API /api/rag/upload-file Error]:', err);
    res.status(500).json({ status: 'error', message: '檔案處理失敗 / File error: ' + err.message });
  }
});

/**
 * 5. List Ingested Documents
 * GET /api/rag/documents
 */
router.get('/documents', async (req, res) => {
  try {
    const { scope = 'all', limit = 50 } = req.query;
    const userId = req.headers['x-user-id'] || req.query.userId || null;

    const docs = await listDocuments({
      scope,
      userId,
      limit: parseInt(limit, 10) || 50
    });

    res.json({
      status: 'ok',
      count: docs.length,
      documents: docs
    });
  } catch (err) {
    console.error('[API /api/rag/documents Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 6. Delete Ingested Document
 * DELETE /api/rag/documents/:docId
 */
router.delete('/documents/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const adminUid = req.headers['x-admin-uid'] || req.query.admin_uid;
    const requestUserId = req.headers['x-user-id'] || req.query.userId;

    let isAdmin = false;
    if (adminUid) {
      const adminUser = await User.findOne({
        $or: [{ uid: adminUid }, { username: adminUid }],
        role: 'admin',
        isActive: { $ne: false }
      });
      if (adminUser) isAdmin = true;
    }

    const result = await deleteDocument(docId, requestUserId, isAdmin);
    res.json({
      status: 'ok',
      message: `已成功刪除文檔及對應之 ${result.deletedChunks} 筆向量切片。/ Document and ${result.deletedChunks} chunks deleted.`,
      data: result
    });
  } catch (err) {
    console.error('[API DELETE /api/rag/documents Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
