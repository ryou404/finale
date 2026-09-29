/**
 * CareerDNA Agent 2: Resume Builder Agent
 * Role: Rewrites rough, informal student project drafts into high-impact,
 * one-liner "Micro-STAR" and "Google XYZ" bullet points.
 */

const { CONFIG, RESUME_BUILDER_JSON_SCHEMA, PROMPTS, validateLLMConfig } = require('../config');
const { deterministicResumeBuilder } = require('../engines/deterministicEngine');

class ResumeBuilderAgent {
  constructor(options = {}) {
    this.name = "ResumeBuilderAgent";
    this.roleId = 2;
    this.model = options.model || CONFIG.llm.model;
    this.temperature = Math.min(options.temperature !== undefined ? options.temperature : CONFIG.llm.temperature, 0.3);
    validateLLMConfig({ temperature: this.temperature });
  }

  /**
   * Execute Resume Builder Agent Pipeline
   * @param {Object} profileResult - Output from Agent 1 (ProfileAgent)
   * @param {Object} studentPayload - Raw input payload
   * @returns {Promise<Object>} Output adhering to RESUME_BUILDER_JSON_SCHEMA
   */
  async execute(profileResult, studentPayload) {
    const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    const safeProfile = (profileResult && typeof profileResult === 'object') ? profileResult : {};
    const safePayload = (studentPayload && typeof studentPayload === 'object') ? studentPayload : {};

    if (!apiKey) {
      const fallbackResult = deterministicResumeBuilder(safeProfile, safePayload);
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
      const prompt = `Resume Generation Request:
Student Target Persona: ${JSON.stringify(safeProfile.targetPersona || {})}
Target Role: ${safePayload.targetRole || safeProfile.targetPersona?.roleTitle || "全端網頁工程師"}
Completed Courses: ${JSON.stringify(safePayload.completedCourses || [])}
Raw Draft to Rewrite: "${safePayload.rawDraft || ""}"

Requirements:
1. For each experience/project in the raw draft, generate:
   - "microStar": One-line STAR narrative (Situation, Task, Action, Result).
   - "googleXyz": Formatted strictly as "Accomplished [X] as measured by [Y], by doing [Z]".
   - "starElements": { situation, task, action, result }
   - "xyzElements": { accomplishedX, measuredByY, byDoingZ }
2. Generate categorized skills: languages, frameworks, tools.
3. Generate a complete formattedResumeMarkdown.
4. Output strictly valid JSON matching schema.`;

      const { callDeepSeekChat } = require('../services/llmService');
      const parsed = await callDeepSeekChat({
        systemPrompt: PROMPTS.resumeBuilderAgent.system,
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
      const fallbackResult = deterministicResumeBuilder(safeProfile, safePayload);
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
  ResumeBuilderAgent
};
