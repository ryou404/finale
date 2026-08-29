/**
 * CareerDNA DeepSeek LLM Service
 * Native integration with DeepSeek Chat Completion API with JSON Schema Enforcement
 */

const { CONFIG } = require('../config');

/**
 * Universal DeepSeek Chat Completion caller
 * @param {Object} options
 * @param {string} options.systemPrompt - System instruction
 * @param {string} options.userPrompt - User prompt message
 * @param {number} [options.temperature] - Temperature (strictly capped <= 0.3)
 * @param {number} [options.maxTokens] - Max output tokens
 * @returns {Promise<Object>} Parsed JSON result
 */
async function callDeepSeekChat({ systemPrompt, userPrompt, temperature = CONFIG.llm.temperature, maxTokens = 4096 }) {
  const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  const baseUrl = CONFIG.api.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = CONFIG.llm.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey) {
    throw new Error('DeepSeek API Key is not configured in .env');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      response_format: { type: 'json_object' },
      temperature: Math.min(temperature, 0.3),
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from DeepSeek API');

  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

module.exports = {
  callDeepSeekChat
};
