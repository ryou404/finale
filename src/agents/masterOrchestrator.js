/**
 * CareerDNA Agent 5: Master Orchestrator
 * Role: Manages sequential execution across Agents 1 -> 4, validates schemas,
 * enforces error resilience & deterministic fallbacks, and aggregates the final structured JSON response.
 */

const { CONFIG, validateLLMConfig } = require('../config');
const { ProfileAgent } = require('./profileAgent');
const { ResumeBuilderAgent } = require('./resumeBuilderAgent');
const { ATSAuditorAgent } = require('./atsAuditorAgent');
const { AcademicGapFillerAgent } = require('./academicGapFillerAgent');
const { generateDeterministicOutput } = require('../engines/deterministicEngine');

class MasterOrchestrator {
  constructor(options = {}) {
    this.name = "MasterOrchestrator";
    this.roleId = 5;
    this.model = options.model || CONFIG.llm.model;
    this.temperature = Math.min(options.temperature !== undefined ? options.temperature : CONFIG.llm.temperature, 0.3);
    validateLLMConfig({ temperature: this.temperature });

    // Initialize the specialized agents
    this.profileAgent = new ProfileAgent({ model: this.model, temperature: this.temperature });
    this.resumeBuilderAgent = new ResumeBuilderAgent({ model: this.model, temperature: this.temperature });
    this.atsAuditorAgent = new ATSAuditorAgent({ model: this.model, temperature: this.temperature });
    this.academicGapFillerAgent = new AcademicGapFillerAgent({ model: this.model, temperature: this.temperature });
  }

  /**
   * Run the end-to-end multi-agent pipeline
   * @param {Object} rawInputPayload - Raw student input
   * @param {Object} options - Execution options (e.g. forceDeterministic)
   * @returns {Promise<Object>} Final aggregated structured JSON response
   */
  async runPipeline(rawInputPayload, options = {}) {
    const pipelineStartTime = Date.now();
    const agentTraces = [];

    // Defensive normalization
    const normalizedPayload = (rawInputPayload && typeof rawInputPayload === 'object' && !Array.isArray(rawInputPayload))
      ? rawInputPayload
      : {};

    // Force deterministic engine if requested
    const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    if (options.forceDeterministic || !apiKey) {
      const offlineResult = generateDeterministicOutput(normalizedPayload);
      offlineResult.pipelineLatencyMs = Date.now() - pipelineStartTime;
      return offlineResult;
    }

    try {
      // Step 1: Execute Profile Agent (Role 1)
      const profileResult = await this.profileAgent.execute(normalizedPayload);
      agentTraces.push({
        agent: "ProfileAgent",
        role: 1,
        mode: profileResult?._metadata?.executionMode || "live_llm",
        latencyMs: profileResult?._metadata?.latencyMs || 0
      });

      // Step 2: Execute Resume Builder Agent (Role 2)
      const resumeResult = await this.resumeBuilderAgent.execute(profileResult, normalizedPayload);
      agentTraces.push({
        agent: "ResumeBuilderAgent",
        role: 2,
        mode: resumeResult?._metadata?.executionMode || "live_llm",
        latencyMs: resumeResult?._metadata?.latencyMs || 0
      });

      // Step 3: Execute ATS Auditor Agent (Role 3)
      const atsResult = await this.atsAuditorAgent.execute(resumeResult, profileResult, normalizedPayload);
      agentTraces.push({
        agent: "ATSAuditorAgent",
        role: 3,
        mode: atsResult?._metadata?.executionMode || "live_llm",
        latencyMs: atsResult?._metadata?.latencyMs || 0
      });

      // Step 4: Execute Academic Gap-Filler Agent (Role 4)
      const academicResult = await this.academicGapFillerAgent.execute(atsResult, normalizedPayload);
      agentTraces.push({
        agent: "AcademicGapFillerAgent",
        role: 4,
        mode: academicResult?._metadata?.executionMode || "live_llm",
        latencyMs: academicResult?._metadata?.latencyMs || 0
      });

      // Step 5: Master Orchestration & Aggregation
      const personaData = (profileResult && profileResult.targetPersona && typeof profileResult.targetPersona === 'object') ? profileResult.targetPersona : {};
      const experienceBullets = (resumeResult && Array.isArray(resumeResult.rewrittenBullets) ? resumeResult.rewrittenBullets : []).map(b => ({
        original: b.original || b.rawSnippet || "",
        microStar: b.microStar || "",
        googleXyz: b.googleXyz || b.xyzBullet || "",
        starElements: b.starElements || b.star || { situation: "", task: "", action: "", result: "" },
        xyzElements: b.xyzElements || b.xyzDecomposition || { accomplishedX: "", measuredByY: "", byDoingZ: "" }
      }));

      const isAllLive = agentTraces.every(t => t.mode === "live_llm");

      const aggregatedResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        executionMode: isAllLive ? "live_llm" : "hybrid_fallback",
        pipelineLatencyMs: Date.now() - pipelineStartTime,
        agentTraces,

        // Standard Contract: studentProfile
        studentProfile: {
          name: normalizedPayload.name ? String(normalizedPayload.name) : (personaData.name || "學生"),
          targetRole: normalizedPayload.targetRole ? String(normalizedPayload.targetRole) : (personaData.roleTitle || "全端網頁工程師"),
          hollandCode: normalizedPayload.hollandCode !== null && normalizedPayload.hollandCode !== undefined ? String(normalizedPayload.hollandCode) : (personaData.hollandCode || "RIC"),
          targetPersona: personaData.roleTitle || "Junior Full-Stack Web Engineer",
          strengths: personaData.coreStrengths || (Array.isArray(normalizedPayload.strengths) ? normalizedPayload.strengths : []),
          completedCourses: Array.isArray(normalizedPayload.completedCourses) ? normalizedPayload.completedCourses : [],
          specialization: personaData.specialization || "",
          hollandTraitSummary: personaData.hollandTraitSummary || "",
          baselineSkills: personaData.baselineSkills || [],
          academicMilestoneStatus: personaData.academicMilestoneStatus || ""
        },

        // Standard Contract: resume
        resume: {
          summary: (resumeResult && typeof resumeResult.summary === 'string') ? resumeResult.summary : "",
          experienceBullets: experienceBullets,
          skills: (resumeResult && resumeResult.skills && typeof resumeResult.skills === 'object') ? resumeResult.skills : { languages: [], frameworks: [], tools: [] },
          formattedResumeMarkdown: (resumeResult && typeof resumeResult.formattedResumeMarkdown === 'string') ? resumeResult.formattedResumeMarkdown : ""
        },

        // Standard Contract: atsAudit
        atsAudit: {
          overallScore: (atsResult && typeof atsResult.overallScore === 'number') ? atsResult.overallScore : 80,
          metrics: (atsResult && atsResult.metrics && typeof atsResult.metrics === 'object') ? atsResult.metrics : {
            quantifiability: 80,
            completeness: 80,
            relevance: 80
          },
          grade: (atsResult && typeof atsResult.grade === 'string') ? atsResult.grade : "B+",
          auditSummary: (atsResult && typeof atsResult.auditSummary === 'string') ? atsResult.auditSummary : "",
          scoreAnalysis: (atsResult && atsResult.scoreAnalysis && typeof atsResult.scoreAnalysis === 'object') ? atsResult.scoreAnalysis : {},
          matchedTechStack: (atsResult && Array.isArray(atsResult.matchedTechStack)) ? atsResult.matchedTechStack : [],
          missingTechStack: (atsResult && Array.isArray(atsResult.missingTechStack)) ? atsResult.missingTechStack : [],
          atsFlaggedWarnings: (atsResult && Array.isArray(atsResult.atsFlaggedWarnings)) ? atsResult.atsFlaggedWarnings : []
        },

        // Standard Contract: academicPlan
        academicPlan: {
          recommendations: (academicResult && Array.isArray(academicResult.recommendations) ? academicResult.recommendations : []).map(r => ({
            courseCode: r.courseCode || "PU-COURSE",
            courseName: r.courseName || "",
            category: r.category || r.programCluster || "專業學程",
            department: r.department || "資管系",
            credits: typeof r.credits === 'number' ? r.credits : 3,
            teachesSkills: Array.isArray(r.teachesSkills) ? r.teachesSkills : [],
            reason: r.reason || r.rationale || ""
          })),
          timeline: (academicResult && academicResult.timeline && typeof academicResult.timeline === 'object') ? academicResult.timeline : {
            days30: { title: "Foundation & Gap Filling", tasks: [] },
            days60: { title: "Project Enhancement & Integration", tasks: [] },
            days90: { title: "ATS Optimization & Interview Readiness", tasks: [] }
          }
        }
      };

      return aggregatedResponse;
    } catch (criticalErr) {
      console.error(`[${this.name}] Critical pipeline error: ${criticalErr.message}. Executing full deterministic recovery.`);
      const recoveryResult = generateDeterministicOutput(normalizedPayload);
      recoveryResult.pipelineLatencyMs = Date.now() - pipelineStartTime;
      recoveryResult.agentTraces = agentTraces;
      recoveryResult.recoveryNote = `Recovered via deterministic engine due to: ${criticalErr.message}`;
      return recoveryResult;
    }
  }
}

module.exports = {
  MasterOrchestrator
};
