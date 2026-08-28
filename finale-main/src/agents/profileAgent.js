/**
 * CareerDNA Agent 1: Profile Agent
 * Role: Parses university student context (UCAN Holland codes, Providence course records, strengths)
 * and locks in the target persona and technical skill baseline.
 */

const { CONFIG, PROFILE_JSON_SCHEMA, PROMPTS, validateLLMConfig } = require('../config');
const { deterministicProfile } = require('../engines/deterministicEngine');

class ProfileAgent {
  constructor(options = {}) {
    this.name = "ProfileAgent";
    this.roleId = 1;
    this.model = options.model || CONFIG.llm.model;
    this.temperature = Math.min(options.temperature !== undefined ? options.temperature : CONFIG.llm.temperature, 0.3);
    validateLLMConfig({ temperature: this.temperature });
  }

  /**
   * Execute Profile Agent Pipeline
   * @param {Object} studentPayload
   * @returns {Promise<Object>} Output adhering to PROFILE_JSON_SCHEMA
   */
  async execute(studentPayload) {
    const startTime = Date.now();
    const apiKey = CONFIG.api.geminiApiKey;
    const safePayload = (studentPayload && typeof studentPayload === 'object') ? studentPayload : {};

    if (!apiKey) {
      const fallbackResult = deterministicProfile(safePayload);
      return {
        ...fallbackResult,
        _metadata: {
          agent: this.name,
          roleId: this.roleId,
          executionMode: "deterministic_fallback",
          reason: "No API key configured",
          latencyMs: Date.now() - startTime
        }
      };
    }

    try {
      const prompt = `Student Background Analysis Request:
Department: ${safePayload.department || "IM"}
Grade: ${safePayload.grade || "大三"}
UCAN Holland Code: ${safePayload.hollandCode || "RIC"}
Gallup/Core Strengths: ${JSON.stringify(safePayload.strengths || ["排難", "學習", "分析"])}
Completed Providence University Courses: ${JSON.stringify(safePayload.completedCourses || [])}
Target Desired Role: ${safePayload.targetRole || "全端網頁工程師"}
Raw Project Draft: "${safePayload.rawDraft || ""}"

Please analyze this background and return a structured JSON response matching the required schema.`;

      const endpoint = `${CONFIG.api.geminiEndpoint}/${this.model}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: PROMPTS.profileAgent.system }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: this.temperature,
          topP: CONFIG.llm.topP,
          maxOutputTokens: CONFIG.llm.maxOutputTokens
        }
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response from Gemini API");

      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...parsed,
        _metadata: {
          agent: this.name,
          roleId: this.roleId,
          executionMode: "live_llm",
          model: this.model,
          temperature: this.temperature,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (err) {
      console.warn(`[${this.name}] LLM execution failed (${err.message}). Falling back to deterministic engine.`);
      const fallbackResult = deterministicProfile(safePayload);
      return {
        ...fallbackResult,
        _metadata: {
          agent: this.name,
          roleId: this.roleId,
          executionMode: "deterministic_fallback",
          reason: err.message,
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

module.exports = {
  ProfileAgent
};
