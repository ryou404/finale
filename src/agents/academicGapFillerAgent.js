/**
 * CareerDNA Agent 4: Academic Gap-Filler Agent
 * Role: Recommends specific Providence University (靜宜大學) CS/IM course track additions
 * based on missing tech stack tags and builds a comprehensive 30/60/90-day academic action plan.
 */

const { CONFIG, ACADEMIC_GAP_FILLER_JSON_SCHEMA, PROMPTS, validateLLMConfig } = require('../config');
const { deterministicAcademicGapFiller } = require('../engines/deterministicEngine');
const { PROVIDENCE_PROGRAMS, PROVIDENCE_PRACTICAL_CLUSTERS } = require('../data/providenceCourses');

class AcademicGapFillerAgent {
  constructor(options = {}) {
    this.name = "AcademicGapFillerAgent";
    this.roleId = 4;
    this.model = options.model || CONFIG.llm.model;
    this.temperature = Math.min(options.temperature !== undefined ? options.temperature : CONFIG.llm.temperature, 0.3);
    validateLLMConfig({ temperature: this.temperature });
  }

  /**
   * Execute Academic Gap-Filler Agent Pipeline
   * @param {Object} atsAuditResult - Output from Agent 3 (ATSAuditorAgent)
   * @param {Object} studentPayload - Raw student input payload
   * @returns {Promise<Object>} Output adhering to ACADEMIC_GAP_FILLER_JSON_SCHEMA
   */
  async execute(atsAuditResult, studentPayload) {
    const startTime = Date.now();
    const apiKey = CONFIG.api.geminiApiKey;
    const safeATS = (atsAuditResult && typeof atsAuditResult === 'object') ? atsAuditResult : {};
    const safePayload = (studentPayload && typeof studentPayload === 'object') ? studentPayload : {};

    if (!apiKey) {
      const fallbackResult = deterministicAcademicGapFiller(safeATS, safePayload);
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
      const prompt = `Providence University Academic Course Recommendation & Action Plan Request:
Missing Tech Stack Tags: ${JSON.stringify(safeATS.missingTechStack || [])}
Target Desired Role: ${safePayload.targetRole || "全端網頁工程師"}
Completed University Courses: ${JSON.stringify(safePayload.completedCourses || [])}
Department: ${safePayload.department || "IM"}
Grade: ${safePayload.grade || "大三"}

Available Providence University Programs:
${JSON.stringify(PROVIDENCE_PROGRAMS.map(p => ({ name: p.name, courses: p.courses.map(c => c.name) })))}

Available Practical Clusters:
${JSON.stringify(PROVIDENCE_PRACTICAL_CLUSTERS.map(c => ({ name: c.name, courses: c.courses.map(course => course.name) })))}

Please recommend 2-4 exact Providence University courses to bridge the missing tech stack gaps, and construct a realistic 30/60/90-day action plan.
Output strictly valid JSON matching schema.`;

      const endpoint = `${CONFIG.api.geminiEndpoint}/${this.model}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: PROMPTS.academicGapFillerAgent.system }]
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
      const fallbackResult = deterministicAcademicGapFiller(safeATS, safePayload);
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
  AcademicGapFillerAgent
};
