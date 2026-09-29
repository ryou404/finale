/**
 * CareerDNA Agent 3: ATS Auditor Agent
 * Role: Strictly evaluates the generated resume across "Golden Triangle" metrics:
 * Quantifiability (Google XYZ), Completeness (Micro-STAR), and Relevance (ATS Tech Stack Match).
 * Outputs 0-100 scores and flags missing tech stack tags.
 */

const { CONFIG, ATS_AUDITOR_JSON_SCHEMA, PROMPTS, validateLLMConfig } = require('../config');
const { deterministicATSAuditor } = require('../engines/deterministicEngine');

class ATSAuditorAgent {
  constructor(options = {}) {
    this.name = "ATSAuditorAgent";
    this.roleId = 3;
    this.model = options.model || CONFIG.llm.model;
    this.temperature = Math.min(options.temperature !== undefined ? options.temperature : CONFIG.llm.temperature, 0.3);
    validateLLMConfig({ temperature: this.temperature });
  }

  /**
   * Execute ATS Auditor Agent Pipeline
   * @param {Object} resumeResult - Output from Agent 2 (ResumeBuilderAgent)
   * @param {Object} profileResult - Output from Agent 1 (ProfileAgent)
   * @param {Object} studentPayload - Raw student input payload
   * @returns {Promise<Object>} Output adhering to ATS_AUDITOR_JSON_SCHEMA
   */
  async execute(resumeResult, profileResult, studentPayload) {
    const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    const safePayload = (studentPayload && typeof studentPayload === 'object') ? studentPayload : {};
    const safeProfile = (profileResult && typeof profileResult === 'object') ? profileResult : {};
    const safeResume = (resumeResult && typeof resumeResult === 'object') ? resumeResult : {};
    const targetRole = safePayload.targetRole || (safeProfile.targetPersona && safeProfile.targetPersona.roleTitle) || "全端網頁工程師";

    if (!apiKey) {
      const fallbackResult = deterministicATSAuditor(safeResume, safeProfile, targetRole);
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
      const prompt = `ATS Resume Audit Request:
Target Role: ${targetRole}
Target Persona: ${JSON.stringify(profileResult.targetPersona)}
Generated Resume Bullets: ${JSON.stringify(resumeResult.rewrittenBullets)}
Extracted Skills: ${JSON.stringify(resumeResult.skills)}

Please audit this resume across the Golden Triangle metrics (Quantifiability, Completeness, Keyword Relevance).
Ensure overallScore = Math.round(0.35 * quantifiability + 0.35 * completeness + 0.30 * relevance).
List matched and missing tech stack tags.
Output strictly valid JSON matching schema.`;

      const { callDeepSeekChat } = require('../services/llmService');
      const parsed = await callDeepSeekChat({
        systemPrompt: PROMPTS.atsAuditorAgent.system,
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
      const fallbackResult = deterministicATSAuditor(resumeResult, profileResult, targetRole);
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
  ATSAuditorAgent
};
