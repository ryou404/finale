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
    const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
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

      const { callDeepSeekChat } = require('../services/llmService');
      const parsed = await callDeepSeekChat({
        systemPrompt: PROMPTS.profileAgent.system,
        userPrompt: prompt,
        temperature: this.temperature
      });

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
