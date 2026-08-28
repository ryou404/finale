import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function InterviewChat({ contextData }) {
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorState, setErrorState] = useState(null);

  const functions = getFunctions();
  const generateInterviewResponse = httpsCallable(functions, 'generateInterviewResponse');

  const sendMessage = async (messageToUse = inputText) => {
    const trimmedMessage = messageToUse.trim();
    if (!trimmedMessage) return;

    // 1. 準備發送：清除先前的錯誤狀態，開啟 Loading
    setErrorState(null);
    setIsTyping(true);

    // (選擇性) 可以在這裡先將使用者的訊息加入預覽，但標記為 "sending"
    const tempMessageId = Date.now();
    setChatHistory(prev => [...prev, { id: tempMessageId, role: 'user', content: trimmedMessage }]);
    setInputText(""); // 清空輸入框讓使用者感覺系統有在動

    try {
      // 2. 呼叫 Cloud Function
      const result = await generateInterviewResponse({
        message: trimmedMessage,
        context: contextData
      });

      // 3. 成功處理：將 AI 回覆加入歷史紀錄
      setChatHistory(prev => [
        ...prev, 
        { id: Date.now(), role: 'ai', content: result.data.reply }
      ]);
      
    } catch (error) {
      console.error("面試系統 API 錯誤:", error);
      
      // 4. 錯誤處理：攔截 Firebase 拋出的 HttpsError
      let friendlyErrorMessage = "系統暫時有些繁忙，請稍後再試。";
      
      if (error.code === 'functions/invalid-argument') {
        friendlyErrorMessage = "請輸入有效的回答內容喔！";
      } else if (error.code === 'functions/internal') {
        // 我們在後端拋出的 internal 錯誤
        friendlyErrorMessage = "AI 面試官正在喝水，暫時無法回應，請點擊重試。";
      }

      // 設定錯誤狀態，並保留剛才使用者輸入的訊息，以便 UI 提供「重試」功能
      setErrorState({
        message: friendlyErrorMessage,
        failedText: trimmedMessage // 保留文字，方便重試
      });

      // 將預覽的使用者訊息移除，避免邏輯混亂 (或標記為發送失敗)
      setChatHistory(prev => prev.filter(msg => msg.id !== tempMessageId));
      
      // 貼心 UX：把剛剛使用者打的字塞回輸入框，避免心血白費
      setInputText(trimmedMessage);
      
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {chatHistory.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isTyping && <div className="typing-indicator">AI 面試官思考中...</div>}
      </div>

      {/* 錯誤提示與重試區塊 */}
      {errorState && (
        <div className="error-banner text-red-500 bg-red-50 p-3 rounded my-2 flex justify-between">
          <span>⚠️ {errorState.message}</span>
          <button onClick={() => sendMessage(errorState.failedText)} className="underline">
            重新發送
          </button>
        </div>
      )}

      <div className="chat-input-area">
        <textarea value={inputText} onChange={e => setInputText(e.target.value)} disabled={isTyping} />
        <button onClick={() => sendMessage()} disabled={isTyping || !inputText.trim()}>發送</button>
      </div>
    </div>
  );
}