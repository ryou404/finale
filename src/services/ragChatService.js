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
2. 預設以「繁體中文（台灣）」回覆；若使用者使用越南文 (Tiếng Việt) 或英文提問，請自然以相應語言親切作答。
3. 嚴格基於所提供的「知識庫檢索內容」與「工具調用結果」作答。如果知識庫中沒有相關資訊且無法透過工具獲取，請誠實告知，切勿憑空捏造。
4. 嚴格遵守資料隔離與隱私安全，絕對不向任何人透露其他使用者的資料。

【平台架構與功能】：
- **AI 履歷健檢與生成 (career_fit_v2.html)**：結合 Golden Triangle ATS 人資檢核標準、Micro-STAR (STAR-L) 原則與 Google XYZ 量化公式，提供 Classic, Modern, Minimal 3 種 A4 履歷樣式並支援匯出 PDF。
- **品牌測驗 (brand_test.html)**：Holland RIASEC 六大職業性格（R實用, I研究, A藝術, S社交, E企業, C常規）與蓋洛普優勢分析。
- **科系適配 (lab_recommendation.html)**：靜宜資工、資管、AI 三大系所適配度與教授實驗室導覽。
- **個人檔案 (profile.html)**：管理學歷、技能武器庫、歷史履歷典藏庫。
- **學習資源 (resource_library.html)**：資訊領域技能樹、學習地圖、認證指南。
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
    prompt += `\n\n【檢索到的相關知識庫文檔 (RAG Context)】：\n${contextText}\n\n請優先引用上述知識庫文檔回答使用者的問題。`;
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

  // 2. Perform RAG Vector Search
  let retrievedChunks = [];
  try {
    if (userQuery && userQuery.trim().length > 0) {
      retrievedChunks = await searchSimilarChunks({
        query: userQuery,
        userId: userId,
        limit: 4,
        minScore: 0.5
      });
    }
  } catch (searchErr) {
    console.warn('[RAG Chat] Vector search warning:', searchErr.message);
  }

  // 3. Assemble context from retrieved chunks
  let contextText = '';
  const sources = [];
  if (retrievedChunks.length > 0) {
    contextText = retrievedChunks
      .map((c, i) => `[Tài liệu ${i + 1}]: 《${c.title}》\n${c.text}`)
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
  let fallbackReply = '您好！我是 **CareerDNA AI 智能助手**。😊\n\n';

  if (error && error.includes('SHOPAIKEY_API_KEY')) {
    fallbackReply += '> ⚠️ **Hệ thống**: Quản trị viên chưa cấu hình `SHOPAIKEY_API_KEY` trong file `.env`.\n\n';
  }

  if (retrievedChunks.length > 0) {
    fallbackReply += '📚 **Tôi đã tìm thấy một số tài liệu liên quan trong hệ thống:**\n\n';
    retrievedChunks.forEach((c, idx) => {
      fallbackReply += `**${idx + 1}. ${c.title}**\n${c.text.slice(0, 200)}...\n\n`;
    });
    fallbackReply += '👉 Bạn có thể tham khảo trực tiếp các tài liệu trên hoặc kiểm tra mục **學習資源 (resource_library.html)**.';
  } else {
    fallbackReply += '我可以協助您：\n' +
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
