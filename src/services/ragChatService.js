/**
 * RAG Chat Service
 * Orchestrates Retrieval-Augmented Generation (RAG) + Tool Calling for private context
 * via ShopAIKey proxy (OpenAI-compatible /v1/chat/completions).
 */

const { searchSimilarChunks } = require('./ragSearchService');
const { TOOLS_DEFINITIONS, executeTool } = require('./toolCallingService');
const { User } = require('../db/models/User');
const { KnowledgeChunk } = require('../db/models/KnowledgeChunk');

const DEFAULT_BASE_URL = 'https://api.shopaikey.com/v1';
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

const YEAR_CHARS = ['', '一', '二', '三', '四'];
const VI_YEAR_WORDS = { 'nhất': 1, 'nhat': 1, 'hai': 2, 'ba': 3, 'tư': 4, 'tu': 4 };

function toYearNum(s) {
  if (!s) return 0;
  const str = String(s).toLowerCase();
  if (/^[1-4]$/.test(str)) return parseInt(str, 10);
  const idx = YEAR_CHARS.indexOf(str);
  if (idx > 0) return idx;
  return VI_YEAR_WORDS[str] || 0;
}

/**
 * Detect "course recommendation by year/department" intent.
 * Returns { dept, years: number[] } or null.
 */
function detectCurriculumIntent(query = '') {
  const q = String(query).toLowerCase();
  const isRec = /gợi ý|goi y|推薦|推荐|建議|建议|recommend|suggest|môn học|mon hoc|適合修|課程/.test(q);
  if (!isRec) return null;

  let dept = null;
  if (/phần mềm|phan mem|軟體|資工|\bcs\b|công nghệ thông tin|kĩ thuật|kỹ thuật|software/.test(q)) dept = 'CS';
  if (/trí tuệ nhân tạo|人工智慧|\bai\b/.test(q)) dept = 'AI';
  if (/資管|\bim\b|quản trị thông tin|information management/.test(q)) dept = 'IM';
  if (!dept) return null;

  let years = [];
  let m = q.match(/(\d)\s*năm\s*đầu|前\s*([一二三四1-4])\s*年|first\s*(\d)\s*years?/);
  if (m) {
    const n = toYearNum(m[1] || m[2] || m[3]);
    for (let i = 1; i <= n; i++) years.push(i);
  } else if (/toàn bộ|cả 4 năm|4 năm|四年|all years/.test(q)) {
    years = [1, 2, 3, 4];
  } else {
    const re = /năm\s*(nhất|nhat|hai|ba|tư|tu|[1-4])\b|大([一二三四])|([一二三四])年級|year\s*([1-4])/g;
    let x;
    while ((x = re.exec(q)) !== null) {
      const y = toYearNum(x[1] || x[2] || x[3] || x[4]);
      if (y && !years.includes(y)) years.push(y);
    }
  }
  if (years.length === 0) years = [1, 2, 3, 4];
  return { dept, years };
}

/**
 * Build an authoritative course-name list grouped by year from the knowledge base.
 */
async function buildCurriculumContext({ dept, years }) {
  try {
    const docs = await KnowledgeChunk.find({
      'metadata.department': dept,
      'metadata.courseName': { $ne: null },
      'metadata.classGrade': { $ne: null }
    }).select('metadata.courseName metadata.classGrade metadata.courseType').lean();

    const byYear = {};
    for (const d of docs) {
      const md = d.metadata || {};
      const cg = md.classGrade || '';
      const ym = cg.match(/(?:資工|資管|人工智慧|AI|IM|CS)\s*([一二三四])/) || cg.match(/([一二三四])/);
      if (!ym) continue;
      const y = toYearNum(ym[1]);
      if (!y || !years.includes(y)) continue;
      const name = (md.courseName || '').trim();
      if (!name) continue;
      const required = /必修/.test(md.courseType || '');
      byYear[y] = byYear[y] || new Map();
      const prev = byYear[y].get(name);
      byYear[y].set(name, prev || required);
    }

    const lines = [];
    for (const y of years) {
      const map = byYear[y];
      if (!map || map.size === 0) continue;
      const names = [...map.entries()].sort((a, b) => (b[1] ? 1 : 0) - (a[1] ? 1 : 0)).map(e => e[0]);
      lines.push(`第 ${y} 年（大${YEAR_CHARS[y]}）：${names.join('、')}`);
    }
    return lines.join('\n');
  } catch (e) {
    console.warn('[RAG Chat] Curriculum lookup warning:', e.message);
    return '';
  }
}

/**
 * Build rich system prompt for CareerDNA RAG Chatbot
 */
function buildSystemPrompt({ contextText = '', currentPage = '', userInfo = null, userId = null, curriculumText = '' }) {
  let prompt = `你是「CareerDNA AI 智能職涯與知識助手」- 專為靜宜大學（Providence University）資訊學院（資工系、資管系、人工智慧系）打造的 AI 導航與問答系統。

【核心原則】：
1. 語氣專業、清晰、親切、誠懇。
2. 預設以「繁體中文（台灣）」回覆；若使用者使用英文 (English) 提問，請以專業、流暢之英文親切作答。
3. 嚴格基於所提供的「知識庫檢索內容」與「工具調用結果」作答。如果知識庫中沒有相關資訊且無法透過工具獲取，請誠實告知，切勿憑空捏造。
4. 嚴格遵守資料隔離與隱私安全，絕對不向任何人透露其他使用者的資料。
5. 【課程輸出格式（最高優先，覆蓋其他規則）】：只要使用者是在「推薦／建議／gợi ý／recommend／suggest」課程或詢問「適合修哪些課」，回答只能是簡短的課程名稱清單，每行一個，格式如「- 程式設計」。嚴禁輸出：選課代號、授課教師、上課班級、時間地點、修別、學分數、課程簡介、教科書、參考來源。可在開頭加一句簡短說明，結尾加一句邀請使用者詢問某門課詳細資訊即可。

【平台架構與功能】：
- **AI 履歷健檢與生成 (career_fit_v2.html)**：結合 Golden Triangle ATS 人資檢核標準、Micro-STAR (STAR-L) 原則與 Google XYZ 量化公式，提供 Classic, Modern, Minimal 3 種 A4 履歷樣式並支援匯出 PDF。
- **品牌測驗 (brand_test.html)**：Holland RIASEC 六大職業性格（R實用, I研究, A藝術, S社交, E企業, C常規）與蓋洛普優勢分析。
- **科系適配 (lab_recommendation.html)**：靜宜資工、資管、AI 三大系所適配度與教授實驗室導覽。
- **個人檔案 (profile.html)**：管理學歷、技能武器庫、歷史履歷典藏庫。
- **學習資源 (resource_library.html)**：資訊領域技能樹、學習地圖、認證指南。

【靜宜大學課程與選課查詢準則（極重要）】：
1. 精準對應選課代號與系所：
   - 當使用者詢問特定「選課代號」（例如 1776、1711）或指定「系所」（人工智慧 AI / 資工 CS / 資管 IM）時，必須嚴格依據檢索到的該代號資料回答。
    - 【推薦課程】：當使用者要求推薦／建議課程時，只列「課程名稱」，嚴禁附上選課代號、教師、時間、教室、學分、修別、簡介、教科書，也不要加上任何「參考來源／文件名稱」。
    - 僅當使用者明確詢問某門課或某選課代號的詳細資訊時，才提供：課程名稱、選課代號、授課教師、上課班級、時間地點（星期幾、第幾節、教室）、主要教科書及作者/出版社。
    - 任何回答都不要列出知識庫檔案名稱或「Sources／參考來源」。
2. 嚴格杜絕代號混淆與幻覺：
   - 切勿在知識庫中存在該代號時，自作聰明斷定使用者記錯代號（例如絕對不能將 1776 擅自更換為 1711）！
   - 若不同系所開設同名課程（例如 AI 系與資工系皆有開授「網頁前端程式設計」），必須按使用者指定的「選課代號」或「班級」給出正確對應的課程，不可張冠李戴。
   - 若檢索內容確實無該代號，請誠實說明暫無該代號資料，切勿隨意指定其他課程代替。
`;

  if (userId) {
    const roleLabel = userInfo?.role === 'admin' ? '系統超級管理員 (Super Admin)' : '一般學生/使用者 (Student/User)';
    prompt += `\n【當前已驗證登入使用者身分 (Authenticated Current User)】：
- User ID (UID): ${userId}
- 姓名/名稱: ${userInfo?.name || '同學'}
- 帳號 (Username): ${userInfo?.username || '未知'}
- 系統角色權限: ${roleLabel}
${userInfo?.department ? `- 科系: ${userInfo.department}` : ''}
${userInfo?.grade ? `- 年級: ${userInfo.grade}` : ''}

【極重要身份判定與隔離規則 (Strict Identity Isolation)】：
1. 當使用者詢問「我是誰」、「我現在登入的帳號是誰/叫什麼名字」、「我的帳號身分」等身分相關問題，請務必嚴格依據上方【當前已驗證登入使用者身分】回答（當前登入者為：${userInfo?.name || '同學'}，角色為：${roleLabel}）。
2. 切勿受歷史對話紀錄中曾出現過的其他使用者身分干擾，嚴禁張冠李戴！
3. 當使用者詢問其個人的測驗結果、履歷分數、帳號狀態時，請務必調用對應的工具 (getUserProfile, getUserTestResults, getUserResumeAndCV, getUserAccountStatus) 進行實時查詢。`;
  } else {
    prompt += `\n【當前使用者為訪客 (未登入)】：
- 使用者尚未登入。若使用者詢問個人測驗結果、履歷或帳號資訊，請親切提醒使用者登入帳號後即可查詢個人化專屬資料。`;
  }

  if (currentPage) {
    prompt += `\n- 使用者目前正在瀏覽頁面：${currentPage}`;
  }

  if (contextText && contextText.trim().length > 0) {
    prompt += `\n\n【檢索到的相關知識庫文檔 (RAG Context)】：\n${contextText}\n\n請務必優先且忠實引用上述知識庫文檔回答使用者的問題。\n（注意：若是推薦／建議課程，文檔中的教師、時間、教室、學分、簡介等細節一律不要輸出，只列課程名稱。）`;
  }

  if (curriculumText && curriculumText.trim().length > 0) {
    prompt += `\n\n【系統依年級彙整之完整課程名稱清單（權威資料，推薦課程時以此為準）】：\n${curriculumText}\n\n請依照上述各「年級」分組，逐年列出課程名稱（每年各一個小標題，使用者要求幾年就必須涵蓋每一年，不可只回答其中一年）。每年挑選約 6~10 門代表性課程，優先必修課；只輸出名稱，不含任何其他細節。\n【輸出排版（Markdown）】：開頭一句簡短說明；每一年用「### 🎓 大X（第 X 年）」作標題；其下每門課一行，格式「- **課程名稱**」（課程名稱粗體，行與行之間不要空行）；各年之間只空一行；結尾一句邀請使用者詢問某門課詳細資訊。`;
  }

  return prompt;
}

/**
 * Handle incoming chat interaction
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.messages - Chat message history
 * @param {string|null} [params.userId=null] - Authenticated user ID
 * @param {string} [params.currentPage=''] - Current page URL / name
 * @param {Object} [params.userInfo=null] - Optional user context from client
 */
async function processRagChat({ messages = [], userId = null, currentPage = '', userInfo = null }) {
  const apiKey = process.env.SHOPAIKEY_API_KEY;
  const baseUrl = (process.env.SHOPAIKEY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const chatModel = process.env.SHOPAIKEY_CHAT_MODEL || DEFAULT_CHAT_MODEL;

  // 0. Auto-verify & enrich userInfo from MongoDB database if userId is provided
  if (userId) {
    try {
      const dbUser = await User.findOne({
        $or: [
          { uid: String(userId) },
          { _id: (typeof userId === 'string' && userId.length === 24) ? userId : null }
        ]
      }).lean();
      if (dbUser) {
        userInfo = {
          uid: dbUser.uid,
          name: dbUser.name || dbUser.displayName || dbUser.username,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          department: dbUser.department || dbUser.dept,
          grade: dbUser.grade,
          ...(userInfo || {})
        };
      }
    } catch (uErr) {
      console.warn('[RAG Chat] Could not fetch dbUser:', uErr.message);
    }
  }

  // 1. Identify latest user query
  const lastUserMsgObj = [...messages].reverse().find(m => m.role === 'user');
  const userQuery = lastUserMsgObj ? lastUserMsgObj.content : '';

  // 2. Perform RAG Hybrid Search
  let retrievedChunks = [];
  try {
    if (userQuery && userQuery.trim().length > 0) {
      retrievedChunks = await searchSimilarChunks({
        query: userQuery,
        userId: userId,
        limit: 7,
        minScore: 0.3
      });
    }
  } catch (searchErr) {
    console.warn('[RAG Chat] Hybrid search warning:', searchErr.message);
  }

  // 3. Assemble context from retrieved chunks
  let contextText = '';
  const sources = [];
  if (retrievedChunks.length > 0) {
    contextText = retrievedChunks
      .map((c, i) => `[知識庫文檔 ${i + 1} / Document ${i + 1}]: 《${c.title}》\n${c.text}`)
      .join('\n\n---\n\n');

    for (const c of retrievedChunks) {
      if (!sources.some(s => s.docId === c.docId)) {
        sources.push({ docId: c.docId, title: c.title, scope: c.scope });
      }
    }
  }

  // 4. Check if API Key is configured
  if (!apiKey) {
    return generateOfflineFallback({ userQuery, retrievedChunks, userId, userInfo });
  }

  // 5. Build system prompt & message payload
  let curriculumText = '';
  const curIntent = detectCurriculumIntent(userQuery);
  if (curIntent) {
    curriculumText = await buildCurriculumContext(curIntent);
  }
  const systemPrompt = buildSystemPrompt({ contextText, currentPage, userInfo, userId, curriculumText });
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || '')
    }))
  ];

  // 6. Call ShopAIKey Chat Completion with Tools
  const toolsUsed = [];
  try {
    const requestPayload = {
      model: chatModel,
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 1500,
      tools: TOOLS_DEFINITIONS,
      tool_choice: 'auto'
    };

    const firstRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!firstRes.ok) {
      const errText = await firstRes.text();
      throw new Error(`HTTP ${firstRes.status}: ${errText}`);
    }

    const firstData = await firstRes.json();
    const choice = firstData?.choices?.[0];
    const message = choice?.message;

    // Check if LLM requested tool execution
    if (message && message.tool_calls && message.tool_calls.length > 0) {
      console.log(`[RAG Chat] LLM requested ${message.tool_calls.length} tool calls for user ${userId || 'anonymous'}`);

      formattedMessages.push(message);

      for (const toolCall of message.tool_calls) {
        const funcName = toolCall.function?.name;
        let funcArgs = {};
        try {
          funcArgs = JSON.parse(toolCall.function?.arguments || '{}');
        } catch (e) {
          funcArgs = {};
        }

        console.log(`[RAG Chat] Executing tool: ${funcName}`);
        const toolOutput = await executeTool(funcName, funcArgs, userId);
        toolsUsed.push({ name: funcName, args: funcArgs });

        formattedMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolOutput)
        });
      }

      // Synthesize final answer with tool outputs
      const secondRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: chatModel,
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!secondRes.ok) {
        const errText = await secondRes.text();
        throw new Error(`HTTP ${secondRes.status}: ${errText}`);
      }

      const secondData = await secondRes.json();
      const finalReply = secondData?.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể tổng hợp câu trả lời lúc này.';
      return {
        status: 'ok',
        reply: finalReply,
        sources,
        toolsUsed,
        model: chatModel
      };
    }

    // Direct answer without tools
    const directReply = message?.content || 'Xin lỗi, tôi không nhận được phản hồi phù hợp.';
    return {
      status: 'ok',
      reply: directReply,
      sources,
      toolsUsed,
      model: chatModel
    };
  } catch (err) {
    console.error('[RAG Chat] Lỗi gọi ShopAIKey chat API:', err.message);
    return generateOfflineFallback({ userQuery, retrievedChunks, userId, userInfo, error: err.message });
  }
}

/**
 * Fallback response when LLM service is offline or not configured
 */
function generateOfflineFallback({ userQuery = '', retrievedChunks = [], userId = null, userInfo = null, error = null }) {
  const isEnglish = /[a-zA-Z]{4,}/.test(userQuery) && !/[\u4e00-\u9fa5]/.test(userQuery);

  let fallbackReply = isEnglish
    ? 'Hello! I am the **CareerDNA AI Career Advisor**. 😊\n\n'
    : '您好！我是 **CareerDNA AI 智能助手**。😊\n\n';

  if (error && error.includes('SHOPAIKEY_API_KEY')) {
    fallbackReply += isEnglish
      ? '> ⚠️ **System Notice**: `SHOPAIKEY_API_KEY` is not yet configured in `.env`.\n\n'
      : '> ⚠️ **系統提示**: 管理員尚未配置 `SHOPAIKEY_API_KEY`。\n\n';
  }

  if (retrievedChunks.length > 0) {
    fallbackReply += isEnglish
      ? '📚 **Relevant knowledge documents found in the system:**\n\n'
      : '📚 **為您找到以下相關知識庫文檔：**\n\n';
    retrievedChunks.forEach((c, idx) => {
      fallbackReply += `**${idx + 1}. ${c.title}**\n${c.text.slice(0, 200)}...\n\n`;
    });
    fallbackReply += isEnglish
      ? '👉 You may refer to the documents above or explore **Learning Resources (resource_library.html)**.'
      : '👉 您可直接參閱上述內容，或前往 **學習資源庫 (resource_library.html)** 查看完整資訊。';
  } else {
    fallbackReply += isEnglish
      ? 'I can assist you with:\n' +
        '1. **AI Resume Diagnosis**: Visit [AI Resume Fit](career_fit_v2.html) for ATS optimization and A4 PDF export.\n' +
        '2. **Holland RIASEC Assessment**: Discover your career personality at [Brand Test](brand_test.html).\n' +
        '3. **Department & Lab Guidance**: Explore Providence CS, IM, and AI programs at [Lab Recommendation](lab_recommendation.html).\n' +
        '4. **Personal Dossier**: Review your saved resumes and skill profile at [Profile](profile.html).\n\n' +
        'Please enter your question, and I will be delighted to guide you!'
      : '我可以協助您：\n' +
        '1. **AI 履歷健檢與生成**：前往 [AI 履歷健檢](career_fit_v2.html)，一鍵診斷並生成符合 ATS 標準的履歷。\n' +
        '2. **Holland 職涯測驗**：於 [品牌測驗](brand_test.html) 探索 RIASEC 六大職業性格。\n' +
        '3. **科系適配與實驗室**：於 [科系適配](lab_recommendation.html) 探索靜宜資工、資管、AI 三大系所。\n' +
        '4. **個人檔案與歷史履歷**：於 [個人檔案](profile.html) 隨時查閱歷史生成的履歷。\n\n' +
        '請輸入您的問題，我會為您提供指引！';
  }

  return {
    status: 'ok',
    reply: fallbackReply,
    sources: retrievedChunks.map(c => ({ docId: c.docId, title: c.title, scope: c.scope })),
    toolsUsed: [],
    isFallback: true
  };
}

module.exports = {
  processRagChat
};
