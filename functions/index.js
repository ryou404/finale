const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

// 接收前端的訊息與履歷上下文，呼叫 Gemini AI 進行客製化回覆
// (注意：需要在 Firebase CLI 執行 `firebase functions:secrets:set GEMINI_API_KEY` 設定金鑰)
exports.generateInterviewResponse = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    const { message, context } = request.data;

    if (!message || typeof message !== "string" || message.trim() === "") {
        throw new HttpsError("invalid-argument", "沒有收到使用者的訊息內容");
    }

    // 拆解使用者的快取資料 (Data Silos 解除)
    const brandData = context?.brand || {};
    const resumeData = context?.resume || {};
    
    const hollandCode = brandData?.topHollandCode || "未知";
    const strengths = brandData?.topStrengths?.join(", ") || "無資料";
    const resumeScore = resumeData?.totalScore || 0;

    const systemPrompt = `
    你是一個嚴格但專業的 IT 產業面試官。面試者的資料如下：
    - Holland 性格：${hollandCode} 型人才
    - Gallup 天賦：${strengths}
    - 履歷總分：${resumeScore} / 100

    請根據他的回答，給出建設性的回饋，並指出其回答中不足的地方，接著提出下一個尖銳的追問。
    請保持繁體中文，語氣精煉專業，總字數限制在 120 字以內。
    `;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        // 修復：1. 改用 camelCase (systemInstruction)  2. parts 必須是陣列
        const requestBody = {
            systemInstruction: { parts: [{ text: systemPrompt.trim() }] },
            contents: [{ parts: [{ text: message.trim() }] }]
        };

        // 利用 Node.js 原生的 fetch 呼叫 Gemini REST API
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // 優化：處理非 200 HTTP 狀態碼，避免 silently fail 造成 Debug 困難
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Gemini API 回應錯誤 (HTTP ${response.status}):`, errorText);
            throw new HttpsError("internal", "與 AI 面試官通訊失敗，請稍後再試。");
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return { reply: replyText || "抱歉，面試系統暫時無法回應，請稍後再試。" };
    } catch (error) {
        // 避免重複包裝我們自己拋出的 HttpsError
        if (error instanceof HttpsError) throw error;
        
        logger.error("Gemini AI API 錯誤", error);
        throw new HttpsError("internal", "與 AI 面試官通訊失敗");
    }
});
