/**
 * ============================================================================
 * CareerDNA AI Assistant - Global Floating Chat Widget
 * Providence University (靜宜大學) Multi-Agent AI Career Guidance
 * ============================================================================
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.CareerDNA_ChatWidget) return; // Prevent duplicate instantiation

  const STORAGE_KEY = 'cdna_chat_history_v2';
  const OPEN_STATE_KEY = 'cdna_chat_is_open';

  // Quick Prompt Recommendations (Traditional Chinese)
  const QUICK_PROMPTS = [
    { label: '🎯 CareerDNA 平台介紹', text: '請介紹 CareerDNA 平台的核心功能與特色？' },
    { label: '📝 如何生成與匯出履歷', text: '如何使用 AI 健檢生成履歷並匯出標準 A4 PDF？' },
    { label: '🧭 何謂 Holland 職涯測驗', text: '請說明 Holland RIASEC 職涯測驗如何幫助學生探索方向？' },
    { label: '🏫 靜宜資院三系導覽', text: '請介紹靜宜大學資訊學院（資工、資管、人工智慧）的專業特色與研究方向？' }
  ];

  class ChatWidget {
    constructor() {
      this.isOpen = false;
      this.isThinking = false;
      this.messages = [];
      this.init();
    }

    init() {
      this.injectStyles();
      this.renderWidgetHTML();
      this.loadHistory();
      this.bindEvents();

      // Check if previously open
      if (sessionStorage.getItem(OPEN_STATE_KEY) === 'true') {
        this.openChat();
      }
    }

    injectStyles() {
      if (document.getElementById('cdna-chat-styles')) return;
      const style = document.createElement('style');
      style.id = 'cdna-chat-styles';
      style.textContent = `
        /* CareerDNA Floating Chat Widget Styles */
        #cdna-chat-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
          pointer-events: none;
        }
        #cdna-chat-container * {
          box-sizing: border-box;
          pointer-events: auto;
        }

        /* Floating Toggle Button */
        #cdna-chat-toggle-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #002fa7 0%, #001a5e 100%);
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 10px 25px -5px rgba(0, 47, 167, 0.5), 0 0 0 1px rgba(0, 47, 167, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        #cdna-chat-toggle-btn:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(0, 47, 167, 0.65);
        }
        #cdna-chat-toggle-btn:active {
          transform: scale(0.95);
        }
        #cdna-chat-toggle-btn .toggle-icon {
          font-size: 24px;
          transition: transform 0.3s ease;
        }
        #cdna-chat-toggle-btn.is-open .toggle-icon {
          transform: rotate(90deg);
        }
        .cdna-online-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 14px;
          height: 14px;
          background: #10b981;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
        }

        /* Chat Window */
        #cdna-chat-window {
          position: absolute;
          bottom: 72px;
          right: 0;
          width: 390px;
          max-width: calc(100vw - 32px);
          height: 580px;
          max-height: calc(100vh - 120px);
          background: #ffffff;
          border: 2px solid #002fa7;
          box-shadow: 0 20px 40px -10px rgba(0, 26, 94, 0.35);
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        #cdna-chat-window.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        /* Header */
        .cdna-chat-header {
          background: #002fa7;
          color: #ffffff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #001a5e;
          flex-shrink: 0;
        }
        .cdna-chat-header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cdna-chat-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cdna-chat-header-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #ffffff;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s ease;
        }
        .cdna-chat-header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Messages Area */
        .cdna-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cdna-chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .cdna-chat-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }

        /* Message Bubbles */
        .cdna-msg {
          display: flex;
          gap: 8px;
          max-width: 88%;
          animation: cdnaMsgIn 0.2s ease-out;
        }
        @keyframes cdnaMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cdna-msg.cdna-user-msg {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .cdna-msg.cdna-ai-msg {
          align-self: flex-start;
        }
        .cdna-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #002fa7;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cdna-user-msg .cdna-msg-avatar {
          background: #001a5e;
        }
        .cdna-msg-bubble {
          padding: 10px 14px;
          font-size: 12.5px;
          line-height: 1.6;
          word-break: break-word;
        }
        .cdna-ai-msg .cdna-msg-bubble {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .cdna-user-msg .cdna-msg-bubble {
          background: #002fa7;
          color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 47, 167, 0.2);
        }

        /* Markdown in AI bubble */
        .cdna-msg-bubble p { margin: 0 0 6px 0; }
        .cdna-msg-bubble p:last-child { margin-bottom: 0; }
        .cdna-msg-bubble strong { color: #002fa7; font-weight: 700; }
        .cdna-user-msg .cdna-msg-bubble strong { color: #ffffff; }
        .cdna-msg-bubble ul, .cdna-msg-bubble ol { margin: 4px 0 6px 18px; padding: 0; }
        .cdna-msg-bubble li { margin-bottom: 3px; }
        .cdna-msg-bubble code {
          background: #f1f5f9;
          padding: 1px 4px;
          font-family: monospace;
          font-size: 11.5px;
          color: #002fa7;
        }
        .cdna-msg-bubble a {
          color: #002fa7;
          text-decoration: underline;
          font-weight: 600;
        }
        .cdna-msg-bubble a:hover {
          color: #1a4ec4;
        }

        /* Quick Prompts Container */
        .cdna-chat-quick-prompts {
          padding: 10px 14px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex-shrink: 0;
        }
        .cdna-quick-btn {
          font-size: 11px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          padding: 4px 9px;
          background: #f0f4ff;
          color: #002fa7;
          border: 1px solid #d0daf7;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 2px;
        }
        .cdna-quick-btn:hover {
          background: #002fa7;
          color: #ffffff;
          border-color: #002fa7;
        }

        /* Input Bar */
        .cdna-chat-input-bar {
          padding: 12px 14px;
          background: #ffffff;
          border-top: 2px solid #002fa7;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .cdna-chat-input {
          flex: 1;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          font-size: 12.5px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease;
          resize: none;
          max-height: 80px;
          min-height: 38px;
        }
        .cdna-chat-input:focus {
          border-color: #002fa7;
        }
        .cdna-chat-send-btn {
          width: 38px;
          height: 38px;
          background: #002fa7;
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }
        .cdna-chat-send-btn:hover {
          background: #001a5e;
        }
        .cdna-chat-send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        /* Typing Dots Animation */
        .cdna-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
        }
        .cdna-typing-dot {
          width: 6px;
          height: 6px;
          background: #002fa7;
          border-radius: 50%;
          animation: cdnaBounce 1.4s infinite ease-in-out both;
        }
        .cdna-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .cdna-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes cdnaBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    renderWidgetHTML() {
      const container = document.createElement('div');
      container.id = 'cdna-chat-container';
      container.innerHTML = `
        <!-- Floating Toggle Button -->
        <button id="cdna-chat-toggle-btn" aria-label="開啟 CareerDNA AI 智能助手" title="CareerDNA AI 智能助手">
          <i class="fa-solid fa-comments toggle-icon" id="cdna-toggle-icon"></i>
          <span class="cdna-online-dot"></span>
        </button>

        <!-- Chat Window -->
        <div id="cdna-chat-window">
          <!-- Header -->
          <div class="cdna-chat-header">
            <div class="cdna-chat-header-title">
              <i class="fa-solid fa-robot"></i>
              <span>CareerDNA AI Assistant</span>
            </div>
            <div class="cdna-chat-header-actions">
              <button class="cdna-chat-header-btn" id="cdna-chat-clear-btn" title="清除對話紀錄">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
              <button class="cdna-chat-header-btn" id="cdna-chat-close-btn" title="關閉視窗">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Messages List -->
          <div class="cdna-chat-messages" id="cdna-chat-messages-box">
            <!-- Populated dynamically -->
          </div>

          <!-- Quick Prompts Pill Bar -->
          <div class="cdna-chat-quick-prompts" id="cdna-quick-prompts-bar">
            ${QUICK_PROMPTS.map(p => `
              <button type="button" class="cdna-quick-btn" data-text="${p.text}">
                ${p.label}
              </button>
            `).join('')}
          </div>

          <!-- Input Bar -->
          <div class="cdna-chat-input-bar">
            <textarea id="cdna-chat-input" class="cdna-chat-input" placeholder="詢問平台功能、生成履歷、探索科系..." rows="1"></textarea>
            <button id="cdna-chat-send-btn" class="cdna-chat-send-btn" title="發送訊息">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(container);
    }

    loadHistory() {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.messages = JSON.parse(saved);
        }
      } catch (e) {
        this.messages = [];
      }

      // If no history, add default greeting (Traditional Chinese)
      if (!this.messages || this.messages.length === 0) {
        const user = window.CareerDNA_DB ? window.CareerDNA_DB.getCurrentUser() : null;
        const name = user?.name || user?.displayName || user?.username || '同學';
        this.messages = [
          {
            role: 'assistant',
            content: `您好 **${name}**！👋 我是 **CareerDNA AI 智能助手**。\n\n我可以為您解答關於 CareerDNA 平台的各項功能使用疑問，例如：進行 Holland 職涯測驗、AI 深度履歷健檢、切換範本匯出 PDF，或是探索靜宜大學資訊學院的專業課程與實驗室。歡迎點擊下方快捷問題或直接輸入您的提問！✨`
          }
        ];
      }

      this.renderMessages();
    }

    saveHistory() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
      } catch (e) {}
    }

    renderMessages() {
      const box = document.getElementById('cdna-chat-messages-box');
      if (!box) return;

      box.innerHTML = this.messages.map(m => {
        const isUser = m.role === 'user';
        const formattedText = this.formatMarkdown(m.content);
        return `
          <div class="cdna-msg ${isUser ? 'cdna-user-msg' : 'cdna-ai-msg'}">
            <div class="cdna-msg-avatar">
              <i class="fa-solid ${isUser ? 'fa-user' : 'fa-brain'}"></i>
            </div>
            <div class="cdna-msg-bubble">
              ${formattedText}
            </div>
          </div>
        `;
      }).join('');

      // Scroll to bottom
      box.scrollTop = box.scrollHeight;
    }

    formatMarkdown(text) {
      if (!text) return '';
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Bold **text**
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic *text*
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Inline code `text`
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      // Markdown links [text](url)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
      // Lists
      html = html.replace(/^[-*•]\s+(.+)/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      // Paragraphs & Line breaks
      html = html.replace(/\n\n/g, '</p><p>');
      html = html.replace(/\n/g, '<br>');

      return `<p>${html}</p>`;
    }

    bindEvents() {
      const toggleBtn = document.getElementById('cdna-chat-toggle-btn');
      const closeBtn = document.getElementById('cdna-chat-close-btn');
      const clearBtn = document.getElementById('cdna-chat-clear-btn');
      const sendBtn = document.getElementById('cdna-chat-send-btn');
      const input = document.getElementById('cdna-chat-input');
      const quickBar = document.getElementById('cdna-quick-prompts-bar');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleChat());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeChat());
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearHistory());
      }
      if (sendBtn) {
        sendBtn.addEventListener('click', () => this.sendMessage());
      }
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
      if (quickBar) {
        quickBar.addEventListener('click', (e) => {
          const btn = e.target.closest('.cdna-quick-btn');
          if (btn) {
            const promptText = btn.getAttribute('data-text');
            if (promptText) {
              this.sendMessage(promptText);
            }
          }
        });
      }
    }

    toggleChat() {
      if (this.isOpen) this.closeChat();
      else this.openChat();
    }

    openChat() {
      this.isOpen = true;
      sessionStorage.setItem(OPEN_STATE_KEY, 'true');
      const win = document.getElementById('cdna-chat-window');
      const btn = document.getElementById('cdna-chat-toggle-btn');
      const icon = document.getElementById('cdna-toggle-icon');
      if (win) win.classList.add('is-open');
      if (btn) btn.classList.add('is-open');
      if (icon) icon.className = 'fa-solid fa-xmark toggle-icon';

      const input = document.getElementById('cdna-chat-input');
      if (input) setTimeout(() => input.focus(), 150);

      const box = document.getElementById('cdna-chat-messages-box');
      if (box) box.scrollTop = box.scrollHeight;
    }

    closeChat() {
      this.isOpen = false;
      sessionStorage.setItem(OPEN_STATE_KEY, 'false');
      const win = document.getElementById('cdna-chat-window');
      const btn = document.getElementById('cdna-chat-toggle-btn');
      const icon = document.getElementById('cdna-toggle-icon');
      if (win) win.classList.remove('is-open');
      if (btn) btn.classList.remove('is-open');
      if (icon) icon.className = 'fa-solid fa-comments toggle-icon';
    }

    clearHistory() {
      if (!confirm('確定要清除所有對話紀錄嗎？')) return;
      sessionStorage.removeItem(STORAGE_KEY);
      this.messages = [];
      this.loadHistory();
    }

    async sendMessage(explicitText = null) {
      if (this.isThinking) return;

      const input = document.getElementById('cdna-chat-input');
      const text = (explicitText !== null ? explicitText : (input ? input.value : '')).trim();
      if (!text) return;

      if (input && explicitText === null) {
        input.value = '';
      }

      // Append user message
      this.messages.push({ role: 'user', content: text });
      this.renderMessages();
      this.saveHistory();

      // Show typing indicator
      this.showTypingIndicator();

      try {
        const userInfo = window.CVTemplates ? window.CVTemplates.collectUserData() : {};
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: this.messages,
            currentPage: currentPage,
            userInfo: userInfo
          })
        });

        const data = await res.json();
        this.hideTypingIndicator();

        const reply = data?.reply || '抱歉，目前連線稍有延遲，請您稍後再試。';
        this.messages.push({ role: 'assistant', content: reply });
        this.renderMessages();
        this.saveHistory();

      } catch (err) {
        console.error('[Chat Widget Error]:', err);
        this.hideTypingIndicator();
        this.messages.push({
          role: 'assistant',
          content: '⚠️ 無法連線至 AI 伺服器，請檢查網路連線後重試！'
        });
        this.renderMessages();
        this.saveHistory();
      }
    }

    showTypingIndicator() {
      this.isThinking = true;
      const sendBtn = document.getElementById('cdna-chat-send-btn');
      if (sendBtn) sendBtn.disabled = true;

      const box = document.getElementById('cdna-chat-messages-box');
      if (!box) return;

      const typingEl = document.createElement('div');
      typingEl.id = 'cdna-typing-wrapper';
      typingEl.className = 'cdna-msg cdna-ai-msg';
      typingEl.innerHTML = `
        <div class="cdna-msg-avatar"><i class="fa-solid fa-brain"></i></div>
        <div class="cdna-msg-bubble">
          <div class="cdna-typing-indicator">
            <span class="cdna-typing-dot"></span>
            <span class="cdna-typing-dot"></span>
            <span class="cdna-typing-dot"></span>
          </div>
        </div>
      `;
      box.appendChild(typingEl);
      box.scrollTop = box.scrollHeight;
    }

    hideTypingIndicator() {
      this.isThinking = false;
      const sendBtn = document.getElementById('cdna-chat-send-btn');
      if (sendBtn) sendBtn.disabled = false;

      const typingEl = document.getElementById('cdna-typing-wrapper');
      if (typingEl) typingEl.remove();
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.CareerDNA_ChatWidget = new ChatWidget();
    });
  } else {
    window.CareerDNA_ChatWidget = new ChatWidget();
  }
})();
