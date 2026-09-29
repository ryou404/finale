/**
 * RAG Search Service - Hybrid Search Engine
 * Combines:
 * 1. Exact Course Code / Metadata Sparse Matching (100% precision for course codes & departments)
 * 2. Dense Vector Semantic Search (Atlas $vectorSearch)
 * 3. Exact Keyword / Course Title Matching
 * 4. Multi-Tenant Scope & User Data Isolation
 */

const { KnowledgeChunk } = require('../db/models/KnowledgeChunk');
const { getEmbedding } = require('./embeddingService');

const INDEX_NAME = process.env.ATLAS_VECTOR_INDEX_NAME || 'vector_index';

/**
 * Extract intent entities from user query (course codes, departments, quoted terms, CJK keywords)
 * @param {string} query
 * @returns {{ courseCodes: string[], department: string|null, quotedPhrases: string[], cjkKeywords: string[] }}
 */
function extractQueryEntities(query) {
  if (!query || typeof query !== 'string') {
    return { courseCodes: [], department: null, quotedPhrases: [], cjkKeywords: [] };
  }

  // 1. Extract 4-digit course codes (Providence University standard e.g. 1776, 1711)
  const courseCodes = query.match(/\b\d{4}\b/g) || [];

  // 2. Extract department intent
  let department = null;
  if (/(\bai\b|khoa\s*ai|ngành\s*ai|trí\s*tuệ\s*nhân\s*tạo|人工智慧)/i.test(query)) {
    department = 'AI';
  } else if (/(\bcs\b|khoa\s*cs|ngành\s*cs|khoa\s*học\s*máy\s*tính|công\s*nghệ\s*thông\s*tin|資工)/i.test(query)) {
    department = 'CS';
  } else if (/(\bim\b|khoa\s*im|ngành\s*im|quản\s*lý\s*thông\s*tin|資管)/i.test(query)) {
    department = 'IM';
  }

  // 3. Extract quoted phrases (e.g. "網頁前端程式設計")
  const quotedMatches = query.match(/["'“「『]([^"'”」』]+)["'”」』]/g) || [];
  const quotedPhrases = quotedMatches.map(m => m.replace(/["'“「『”」』]/g, '').trim()).filter(s => s.length >= 2);

  // 4. Extract Chinese keywords (3+ consecutive characters)
  const cjkMatches = query.match(/[\u4e00-\u9fa5]{3,}/g) || [];
  const cjkKeywords = [...new Set(cjkMatches)];

  return { courseCodes, department, quotedPhrases, cjkKeywords };
}

/**
 * Perform Hybrid Search (Exact Sparse + Dense Vector + Keyword Fallback)
 * @param {Object} params
 * @param {string} params.query - The user's query text
 * @param {string|null} [params.userId=null] - Authenticated user's ID
 * @param {number} [params.limit=6] - Number of top chunks to return
 * @param {number} [params.minScore=0.3] - Minimum cosine similarity threshold
 * @returns {Promise<Array<{ title: string, text: string, score: number, scope: string, docId: string, metadata: Object }>>}
 */
async function searchSimilarChunks({ query, userId = null, limit = 6, minScore = 0.3 }) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }

  const { courseCodes, department, quotedPhrases, cjkKeywords } = extractQueryEntities(query);

  // 1. Build Multi-Tenant Scope Filter
  const scopeFilter = userId
    ? {
        $or: [
          { scope: 'public' },
          { scope: 'user', userId: String(userId) }
        ]
      }
    : { scope: 'public' };

  const candidateMap = new Map();

  const addCandidate = (doc, score, source) => {
    const key = doc._id ? doc._id.toString() : `${doc.docId}_${doc.text?.slice(0, 40)}`;
    const existing = candidateMap.get(key);
    if (!existing || score > existing.score) {
      candidateMap.set(key, {
        _id: doc._id,
        docId: doc.docId,
        title: doc.title,
        text: doc.text,
        score: score,
        scope: doc.scope,
        metadata: doc.metadata || {},
        matchedVia: source
      });
    }
  };

  // 2. PATH A: Exact Sparse Match for Course Codes (Crucial for queries with course IDs like 1776)
  if (courseCodes.length > 0) {
    try {
      const codeRegex = new RegExp(`\\b(${courseCodes.join('|')})\\b`);
      const exactCodeFilter = {
        $and: [
          scopeFilter,
          {
            $or: [
              { 'metadata.courseCode': { $in: courseCodes } },
              { text: { $regex: codeRegex } }
            ]
          }
        ]
      };

      const codeMatches = await KnowledgeChunk.find(exactCodeFilter)
        .limit(10)
        .select('_id docId title text scope metadata');

      for (const doc of codeMatches) {
        let codeScore = 1.0;
        const docDept = doc.metadata?.department;
        // Priority boost if department matches user query
        if (department && docDept && docDept.toUpperCase() === department.toUpperCase()) {
          codeScore += 0.30; // 1.30 -> absolute top rank
        } else if (department && doc.title && doc.title.toUpperCase().includes(department.toUpperCase())) {
          codeScore += 0.25;
        }
        addCandidate(doc, codeScore, 'exact_course_code');
      }
    } catch (codeErr) {
      console.warn('[Hybrid Search] Error in exact code search:', codeErr.message);
    }
  }

  // 3. PATH B: Exact Course Title / Quoted Phrase Match
  const searchTerms = [...quotedPhrases, ...cjkKeywords].filter(Boolean);
  if (searchTerms.length > 0) {
    try {
      const termRegex = new RegExp(searchTerms.join('|'), 'i');
      const phraseFilter = {
        $and: [
          scopeFilter,
          {
            $or: [
              { 'metadata.courseName': { $regex: termRegex } },
              { text: { $regex: termRegex } }
            ]
          }
        ]
      };

      const phraseMatches = await KnowledgeChunk.find(phraseFilter)
        .limit(8)
        .select('_id docId title text scope metadata');

      for (const doc of phraseMatches) {
        let phraseScore = 0.88;
        const docDept = doc.metadata?.department;
        if (department && docDept && docDept.toUpperCase() === department.toUpperCase()) {
          phraseScore += 0.15;
        }
        addCandidate(doc, phraseScore, 'phrase_match');
      }
    } catch (phraseErr) {
      console.warn('[Hybrid Search] Error in phrase search:', phraseErr.message);
    }
  }

  // 4. PATH C: Dense Vector Search (Atlas $vectorSearch)
  try {
    const queryVector = await getEmbedding(query);
    if (queryVector && queryVector.length === 1536) {
      const vectorFilter = userId
        ? {
            $or: [
              { scope: { $eq: 'public' } },
              {
                $and: [
                  { scope: { $eq: 'user' } },
                  { userId: { $eq: String(userId) } }
                ]
              }
            ]
          }
        : { scope: { $eq: 'public' } };

      const pipeline = [
        {
          $vectorSearch: {
            index: INDEX_NAME,
            path: 'embedding',
            queryVector: queryVector,
            numCandidates: Math.max(limit * 15, 60),
            limit: Math.max(limit * 2, 10),
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

      const vectorResults = await KnowledgeChunk.aggregate(pipeline);
      for (const doc of vectorResults) {
        let vScore = doc.score || 0;
        if (vScore >= minScore) {
          // Department boost if user mentioned department
          const docDept = doc.metadata?.department;
          if (department && docDept && docDept.toUpperCase() === department.toUpperCase()) {
            vScore += 0.08;
          }
          addCandidate(doc, vScore, 'vector_search');
        }
      }
    }
  } catch (vectorErr) {
    console.warn(`[Hybrid Search] $vectorSearch warning (${vectorErr.message}). Fallback keyword active.`);
  }

  // 5. Fallback: If no candidates were found at all, perform simple regex search
  if (candidateMap.size === 0) {
    try {
      const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 0) {
        const fallbackFilter = {
          $and: [
            scopeFilter,
            {
              $or: [
                { text: { $regex: words.slice(0, 3).join('|'), $options: 'i' } },
                { title: { $regex: words.slice(0, 3).join('|'), $options: 'i' } }
              ]
            }
          ]
        };
        const fallbacks = await KnowledgeChunk.find(fallbackFilter).limit(limit);
        for (const doc of fallbacks) {
          addCandidate(doc, 0.6, 'fallback_regex');
        }
      }
    } catch (fbErr) {
      console.warn('[Hybrid Search] Fallback search error:', fbErr.message);
    }
  }

  // 6. Rank Fusion: Sort by descending score
  const allCandidates = Array.from(candidateMap.values());
  allCandidates.sort((a, b) => b.score - a.score);

  const topResults = allCandidates.slice(0, limit);

  return topResults.map(item => ({
    docId: item.docId,
    title: item.title,
    text: item.text,
    score: Math.min(Number(item.score.toFixed(4)), 1.0),
    scope: item.scope,
    metadata: item.metadata || {},
    matchedVia: item.matchedVia
  }));
}

module.exports = {
  searchSimilarChunks,
  extractQueryEntities
};
