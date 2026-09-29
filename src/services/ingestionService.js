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
/**
 * Parse course markdown file into structured course-aware chunks
 * Keeps course metadata intact: code, name, teacher, room, department, textbooks
 * @param {string} text - Raw markdown text
 * @param {string} title - Document title/filename
 * @returns {Array<{ text: string, metadata: Object }>}
 */
function parseCourseMarkdownChunks(text, title = '') {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  // Infer default department from filename/title
  let defaultDept = 'PU';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('_ai_') || lowerTitle.includes('ai')) defaultDept = 'AI';
  else if (lowerTitle.includes('_cs_') || lowerTitle.includes('cs') || lowerTitle.includes('資工')) defaultDept = 'CS';
  else if (lowerTitle.includes('_im_') || lowerTitle.includes('im') || lowerTitle.includes('資管')) defaultDept = 'IM';

  const rawSections = normalized.split(/\n(?=##\s+\d+\.\s+)/);
  const chunks = [];

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i].trim();
    if (!section.startsWith('## ')) continue;

    // Extract core course metadata
    const nameMatch = section.match(/^##\s+\d+\.\s*([^\n\r]+)/);
    const courseName = nameMatch ? nameMatch[1].trim() : '';

    const codeMatch = section.match(/-\s*\*\*選課代號\*\*[:：]\s*(\d+)/);
    const courseCode = codeMatch ? codeMatch[1].trim() : '';

    const teacherMatch = section.match(/-\s*\*\*授課教師\*\*[:：]\s*([^\n\r]+)/);
    const instructor = teacherMatch ? teacherMatch[1].trim() : '';

    const classMatch = section.match(/-\s*\*\*上課班級\*\*[:：]\s*([^\n\r]+)/);
    const classGrade = classMatch ? classMatch[1].trim() : '';

    const timeLocMatch = section.match(/-\s*\*\*時間地點\*\*[:：]\s*([^\n\r]+)/);
    const scheduleLocation = timeLocMatch ? timeLocMatch[1].trim() : '';

    const courseTypeMatch = section.match(/-\s*\*\*修別\*\*[:：]\s*([^\n\r]+)/);
    const courseType = courseTypeMatch ? courseTypeMatch[1].trim() : '';

    // Infer department from class name if available
    let dept = defaultDept;
    if (classGrade.includes('人工智慧') || classGrade.includes('AI')) dept = 'AI';
    else if (classGrade.includes('資工') || classGrade.includes('CS')) dept = 'CS';
    else if (classGrade.includes('資管') || classGrade.includes('IM')) dept = 'IM';

    const baseMeta = {
      courseCode: courseCode || null,
      courseName: courseName || null,
      instructor: instructor || null,
      department: dept,
      classGrade: classGrade || null,
      scheduleLocation: scheduleLocation || null,
      courseType: courseType || null
    };

    // If section contains a large weekly schedule table or ability table (> 1500 chars),
    // cleanly separate into Chunk 1 (Profile & Textbooks & Syllabus) and Chunk 2 (Weekly progress)
    const splitIndex = section.search(/###\s*(?:學生能力指標與權重|課程之整體規劃與設計|每週進度)/);

    if (splitIndex !== -1 && section.length > 1500) {
      const part1Text = section.substring(0, splitIndex).trim();
      const part2Raw = section.substring(splitIndex).trim();
      const part2Header = `[課程進度與指標 | 課程: ${courseName} | 選課代號: ${courseCode} | 授課教師: ${instructor} | 系所: ${dept} | 班級: ${classGrade} | 時間地點: ${scheduleLocation}]\n\n`;
      const part2Text = part2Header + part2Raw;

      chunks.push({
        text: part1Text,
        metadata: { ...baseMeta, sectionType: 'course_profile' }
      });

      chunks.push({
        text: part2Text,
        metadata: { ...baseMeta, sectionType: 'course_schedule' }
      });
    } else {
      chunks.push({
        text: section,
        metadata: { ...baseMeta, sectionType: 'course_full' }
      });
    }
  }

  return chunks;
}

/**
 * Split text into semantic chunks with overlap (for general documents)
 * @param {string} text - Raw document text
 * @param {number} chunkSize - Max characters per chunk (default ~800)
 * @param {number} chunkOverlap - Overlap characters (default ~80)
 * @returns {Array<{ text: string, metadata: Object }>}
 */
function splitTextIntoChunks(text, chunkSize = 800, chunkOverlap = 80) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= chunkSize) {
    return [{ text: normalized, metadata: {} }];
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
          chunks.push({ text: currentChunk.trim(), metadata: {} });
          const overlap = currentChunk.slice(-chunkOverlap);
          currentChunk = overlap + ' ' + sent;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
        chunks.push({ text: currentChunk.trim(), metadata: {} });
        const overlap = currentChunk.slice(-chunkOverlap);
        currentChunk = overlap + '\n\n' + trimmedPara;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ text: currentChunk.trim(), metadata: {} });
  }

  return chunks.filter(c => c.text.length >= 15);
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
    throw new Error('文件內容不可為空 (Document content cannot be empty).');
  }

  const cleanTitle = (title || '未命名文檔 (Untitled Document)').trim();
  const documentId = docId || `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  if (scope === 'user' && !userId) {
    throw new Error('個人專屬文件 (scope="user") 必須指定所屬 userId (User ID required for private scope).');
  }

  // Detect whether this is a structured course syllabus document
  const isCourseDoc = /##\s+\d+\.\s+/.test(content) && /選課代號/.test(content);
  let chunkItems = [];

  if (isCourseDoc) {
    chunkItems = parseCourseMarkdownChunks(content, cleanTitle);
    console.log(`[Ingestion] 課程大綱文檔 "${cleanTitle}": 解析出 ${chunkItems.length} 個結構化切片。`);
  }

  // Fallback to standard chunking if not a course catalog or parser found 0 courses
  if (chunkItems.length === 0) {
    chunkItems = splitTextIntoChunks(content, 800, 80);
  }

  if (chunkItems.length === 0) {
    throw new Error('文檔內容過短或無法解析出有效文本切片 (Content too short or invalid).');
  }

  const rawTexts = chunkItems.map(item => item.text);
  console.log(`[Ingestion] 正在為 "${cleanTitle}" (${documentId}) 之 ${rawTexts.length} 個切片生成 Vector Embedding...`);

  const embeddings = await getBatchEmbeddings(rawTexts, 25);
  if (embeddings.length !== rawTexts.length) {
    throw new Error(`Vector 數量 (${embeddings.length}) 與切片數量 (${rawTexts.length}) 不一致。`);
  }

  await KnowledgeChunk.deleteMany({ docId: documentId });

  const totalChunks = chunkItems.length;
  const chunkDocs = chunkItems.map((item, idx) => ({
    docId: documentId,
    title: cleanTitle,
    text: item.text,
    embedding: embeddings[idx],
    scope: scope,
    userId: scope === 'user' ? String(userId) : null,
    metadata: {
      ...metadata,
      ...(item.metadata || {}),
      chunkIndex: idx,
      totalChunks: totalChunks
    }
  }));

  await KnowledgeChunk.insertMany(chunkDocs);
  console.log(`[Ingestion] 成功儲存 ${chunkDocs.length} 個切片至 MongoDB Atlas (docId: ${documentId})`);

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
  if (!docId) throw new Error('必須提供 docId 以刪除文檔 (docId is required).');

  const filter = { docId: docId };
  if (!isAdmin) {
    if (!requestingUserId) {
      throw new Error('無權限刪除此文檔 (Permission denied to delete this document).');
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
