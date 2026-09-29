/**
 * RAG Chat Service
 * Orchestrates Retrieval-Augmented Generation (RAG) + Tool Calling for private context
 * via ShopAIKey proxy (OpenAI-compatible /v1/chat/completions).
 */

const { searchSimilarChunks } = require('./ragSearchService');
const { TOOLS_DEFINITIONS, executeTool } = require('./toolCallingService');

const DEFAULT_BASE_URL = 'https://api.shopaikey.com/v1';
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

/**
 * Build rich system prompt for CareerDNA RAG Chatbot
 */
function buildSystemPrompt({ contextText = '', currentPage = '', userInfo = null, userId = null }) {
  let prompt = `你是「CareerDNA AI 智能職涯與知識助手」- 專為靜宜大學（Providence University）資訊學院（資工系、資管系、人工智慧系）打造的 AI 導航與問答系統。

【核心原則】：
1. 語氣專業、清晰、親切、誠懇。
2. 預設以「繁體中文（台灣）」回覆；若使用者使用英文 (English) 提問，請以專業、流暢之英文親切作答。
3. 嚴格基於所提供的「知識庫檢索內容」與「工具調用結果」作答。如果知識庫中沒有相關資訊且無法透過工具獲取，請誠實告知，切勿憑空捏造。
4. 嚴格遵守資料隔離與隱私安全，絕對不向任何人透露其他使用者的資料。

【平台架構與功能】：
- **AI 履歷健檢與生成 (career_fit_v2.html)**：結合 Golden Triangle ATS 人資檢核標準、Micro-STAR (STAR-L) 原則與 Google XYZ 量化公式，提供 Classic, Modern, Minimal 3 種 A4 履歷樣式並支援匯出 PDF。
- **品牌測驗 (brand_test.html)**：Holland RIASEC 六大職業性格（R實用, I研究, A藝術, S社交, E企業, C常規）與蓋洛普優勢分析。
- **科系適配 (lab_recommendation.html)**：靜宜資工、資管、AI 三大系所適配度與教授實驗室導覽。
- **個人檔案 (profile.html)**：管理學歷、技能武器庫、歷史履歷典藏庫。
- **學習資源 (resource_library.html)**：資訊領域技能樹、學習地圖、認證指南。

【靜宜大學課程與選課查詢準則（極重要）】：
1. 精準對應選課代號與系所：
   - 當使用者詢問特定「選課代號」（例如 1776、1711）或指定「系所」（人工智慧 AI / 資工 CS / 資管 IM）時，必須嚴格依據檢索到的該代號資料回答。
   - 回答必須包含：課程名稱、選課代號、授課教師、上課班級、時間地點（星期幾、第幾節、教室）、主要教科書及作者/出版社。
2. 嚴格杜絕代號混淆與幻覺：
   - 切勿在知識庫中存在該代號時，自作聰明斷定使用者記錯代號（例如絕對不能將 1776 擅自更換為 1711）！
   - 若不同系所開設同名課程（例如 AI 系與資工系皆有開授「網頁前端程式設計」），必須按使用者指定的「選課代號」或「班級」給出正確對應的課程，不可張冠李戴。
   - 若檢索內容確實無該代號，請誠實說明暫無該代號資料，切勿隨意指定其他課程代替。
`;

  if (userId) {
    prompt += `\n【當前使用者已登入】：
- User ID: ${userId}
${userInfo?.name ? `- 姓名: ${userInfo.name}` : ''}
${userInfo?.department ? `- 科系: ${userInfo.department}` : ''}
${userInfo?.grade ? `- 年級: ${userInfo.grade}` : ''}
- 當使用者詢問其個人的測驗結果、履歷分數、帳號狀態、個人資料時，請務必調用對應的工具 (getUserProfile, getUserTestResults, getUserResumeAndCV, getUserAccountStatus) 進行實時查詢。`;
  } else {
    prompt += `\n【當前使用者為訪客 (未登入)】：
- 使用者尚未登入。若使用者詢問個人測驗結果、履歷或帳號資訊，請親切提醒使用者登入帳號後即可查詢個人化專屬資料。`;
  }

  if (currentPage) {
    prompt += `\n- 使用者目前正在瀏覽頁面：${currentPage}`;
  }

  if (contextText && contextText.trim().length > 0) {
    prompt += `\n\n【檢索到的相關知識庫文檔 (RAG Context)】：\n${contextText}\n\n請務必優先且忠實引用上述知識庫文檔回答使用者的問題。`;
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
  const systemPrompt = buildSystemPrompt({ contextText, currentPage, userInfo, userId });
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
