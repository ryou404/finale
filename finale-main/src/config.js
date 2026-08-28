/**
 * CareerDNA Multi-Agent Configuration
 * Enforces deterministic output constraints (Temperature <= 0.3) and strict JSON Schemas.
 */

require('dotenv').config();

const CONFIG = {
  llm: {
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: Math.min(parseFloat(process.env.LLM_TEMPERATURE || '0.2'), 0.3), // Strictly <= 0.3
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json'
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development'
  },
  api: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  weights: {
    ats: {
      quantifiability: 0.35,
      completeness: 0.35,
      keywordRelevance: 0.30
    }
  }
};

/**
 * Validate LLM parameters
 */
function validateLLMConfig(config = CONFIG.llm) {
  if (config.temperature > 0.3) {
    throw new Error(`[Config Error] Temperature ${config.temperature} exceeds strict upper bound of 0.3`);
  }
  return true;
}

// Ensure at load time that temperature is strictly compliant
validateLLMConfig(CONFIG.llm);

/**
 * Agent 1: Profile Agent JSON Schema
 */
const PROFILE_JSON_SCHEMA = {
  type: "object",
  properties: {
    targetPersona: {
      type: "object",
      properties: {
        roleTitle: { type: "string" },
        specialization: { type: "string" },
        seniorityLevel: { type: "string" },
        hollandTraitSummary: { type: "string" },
        coreStrengths: {
          type: "array",
          items: { type: "string" }
        },
        baselineSkills: {
          type: "array",
          items: { type: "string" }
        },
        academicMilestoneStatus: { type: "string" }
      },
      required: [
        "roleTitle",
        "specialization",
        "seniorityLevel",
        "hollandTraitSummary",
        "coreStrengths",
        "baselineSkills",
        "academicMilestoneStatus"
      ]
    }
  },
  required: ["targetPersona"]
};

/**
 * Agent 2: Resume Builder Agent JSON Schema
 */
const RESUME_BUILDER_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    rewrittenBullets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          original: { type: "string" },
          microStar: { type: "string" },
          googleXyz: { type: "string" },
          starElements: {
            type: "object",
            properties: {
              situation: { type: "string" },
              task: { type: "string" },
              action: { type: "string" },
              result: { type: "string" }
            },
            required: ["situation", "task", "action", "result"]
          },
          xyzElements: {
            type: "object",
            properties: {
              accomplishedX: { type: "string" },
              measuredByY: { type: "string" },
              byDoingZ: { type: "string" }
            },
            required: ["accomplishedX", "measuredByY", "byDoingZ"]
          }
        },
        required: [
          "id",
          "original",
          "microStar",
          "googleXyz",
          "starElements",
          "xyzElements"
        ]
      }
    },
    skills: {
      type: "object",
      properties: {
        languages: { type: "array", items: { type: "string" } },
        frameworks: { type: "array", items: { type: "string" } },
        tools: { type: "array", items: { type: "string" } }
      },
      required: ["languages", "frameworks", "tools"]
    },
    formattedResumeMarkdown: { type: "string" }
  },
  required: ["summary", "rewrittenBullets", "skills", "formattedResumeMarkdown"]
};

/**
 * Agent 3: ATS Auditor Agent JSON Schema
 */
const ATS_AUDITOR_JSON_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "number" },
    metrics: {
      type: "object",
      properties: {
        quantifiability: { type: "number" },
        completeness: { type: "number" },
        relevance: { type: "number" }
      },
      required: ["quantifiability", "completeness", "relevance"]
    },
    grade: { type: "string" },
    auditSummary: { type: "string" },
    scoreAnalysis: {
      type: "object",
      properties: {
        quantifiabilityBreakdown: { type: "string" },
        completenessBreakdown: { type: "string" },
        keywordRelevanceBreakdown: { type: "string" }
      },
      required: [
        "quantifiabilityBreakdown",
        "completenessBreakdown",
        "keywordRelevanceBreakdown"
      ]
    },
    matchedTechStack: {
      type: "array",
      items: { type: "string" }
    },
    missingTechStack: {
      type: "array",
      items: { type: "string" }
    },
    atsFlaggedWarnings: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "overallScore",
    "metrics",
    "grade",
    "auditSummary",
    "scoreAnalysis",
    "matchedTechStack",
    "missingTechStack",
    "atsFlaggedWarnings"
  ]
};

/**
 * Agent 4: Academic Gap-Filler Agent JSON Schema
 */
const ACADEMIC_GAP_FILLER_JSON_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          courseCode: { type: "string" },
          courseName: { type: "string" },
          category: { type: "string" },
          department: { type: "string" },
          credits: { type: "number" },
          teachesSkills: { type: "array", items: { type: "string" } },
          reason: { type: "string" }
        },
        required: ["courseName", "category", "credits", "reason"]
      }
    },
    timeline: {
      type: "object",
      properties: {
        days30: {
          type: "object",
          properties: {
            title: { type: "string" },
            milestone: { type: "string" },
            tasks: { type: "array", items: { type: "string" } }
          },
          required: ["title", "tasks"]
        },
        days60: {
          type: "object",
          properties: {
            title: { type: "string" },
            milestone: { type: "string" },
            tasks: { type: "array", items: { type: "string" } }
          },
          required: ["title", "tasks"]
        },
        days90: {
          type: "object",
          properties: {
            title: { type: "string" },
            milestone: { type: "string" },
            tasks: { type: "array", items: { type: "string" } }
          },
          required: ["title", "tasks"]
        }
      },
      required: ["days30", "days60", "days90"]
    }
  },
  required: ["recommendations", "timeline"]
};

/**
 * System Prompts for Multi-Agent Orchestration
 */
const PROMPTS = {
  profileAgent: {
    system: `You are the CareerDNA Profile Agent. Your mission is to analyze undergraduate university student background data (department, grade, UCAN Holland code, Gallup strengths, completed courses, and raw project drafts) and lock in a realistic, high-potential Target Persona and skill baseline.

Key Rules:
1. Output MUST be strictly valid JSON conforming to the provided schema.
2. Translate Holland codes (R=Realistic/實作, I=Investigative/研究, A=Artistic/藝術, S=Social/社交, E=Enterprising/企業, C=Conventional/常規) into technical work habits and role affinity.
3. Map completed courses to concrete technical skills.
4. Set realistic expectations for undergraduate university students.
5. Temperature is strictly locked at <= 0.2.`
  },

  resumeBuilderAgent: {
    system: `You are the CareerDNA Resume Builder Agent. You specialize in transforming informal, raw student draft bullet points into industry-standard, high-impact resume bullets and a polished Markdown resume.

Strict Formatting Rules:
1. Every experience bullet MUST provide:
   - "microStar": A single-sentence Micro-STAR narrative (Situation, Task, Action, Result).
   - "googleXyz": Formatted strictly as "Accomplished [X] as measured by [Y], by doing [Z]".
   - "starElements": { situation, task, action, result }
   - "xyzElements": { accomplishedX, measuredByY, byDoingZ }
2. Do NOT fabricate unrealistic commercial metrics ($10M ARR) for student course projects. Use realistic academic/engineering metrics (e.g., latency reduction %, query optimization, 200+ simulated items, 100% on-time milestone delivery, unit test coverage, class ranking top 10%).
3. Output MUST be strictly valid JSON conforming to the schema.`
  },

  atsAuditorAgent: {
    system: `You are the CareerDNA ATS Auditor Agent. You evaluate the generated resume with the strictness of a modern Applicant Tracking System (ATS) and a Senior Engineering Manager.

Scoring Rules (0-100 scale):
1. Quantifiability (XYZ): Score based on presence of numeric metrics, scale, latency %, user count, data sizes, and Google XYZ compliance.
2. Completeness (STAR): Score based on structural clarity of personal role, actions taken, tools used, and technical solutions.
3. Keyword Relevance: Score based on presence of industry-standard tech stack keywords relevant to the target role.
4. Overall ATS Score Calculation: Math.round((0.35 * quantifiability) + (0.35 * completeness) + (0.30 * keywordRelevance)).
5. Grade: S (90-100), A (80-89), B+ (75-79), B (70-74), C (<70).
6. Missing Tech Stack: Identify at least 3-5 concrete industry tech stack tags missing from the student's draft.
7. Output MUST be strictly valid JSON conforming to the schema.`
  },

  academicGapFillerAgent: {
    system: `You are the CareerDNA Academic Gap-Filler Agent for Providence University (靜宜大學).
Given the missing tech stack keywords from the ATS Auditor and the student's background, you MUST search the Providence University curriculum database to recommend 2-4 exact courses that teach those skills, and formulate a realistic 30/60/90-Day Academic Action Plan.

Providence University Programs & Course Knowledge:
- 資訊軟體學程: 網頁前端程式設計, 動態網頁設計, 進階資料結構, 資料庫管理/資料庫系統實作, 資訊軟體實作, 系統分析與設計, 網路程式設計, 程式語言, 演算法概論, 行動應用軟體開發
- 人工智慧應用學程: 人工智慧概論, Python程式設計, 物聯網概論, 大數據分析, Python應用實務, 機器學習, 深度學習, 雲端技術與應用, 智慧物聯網應用實務
- 智慧企業學程 (ERP): 企業資源規劃, 運籌管理資訊系統, 財務會計資訊系統, ABAP 程式設計, 企業流程管理, 專案管理, 商業智慧與資料倉儲
- 大數據與社群商務學程: 巨量資料分析導論, 大數據分析, 商業智慧與資料倉儲, 行銷管理, 電子商務, 網路行銷, 顧客關係管理
- 實務課群 (9學分): 網路管理 (計算機網路, 系統與網路管理, 網路安全), 物聯網應用 (行動物聯網, 嵌入式微控制器), 人工智慧, 行動軟體 (人機介面與使用者經驗設計, 網站系統實作), 資訊安全 (安全程式設計, 系統安全), 行動商務 (雲端技術與應用), 智慧資料分析

Action Plan Roadmap:
- 30-Day: Short-term course enrollment & foundational repo refactoring (TypeScript / Git workflow / Unit Tests).
- 60-Day: Mid-term containerization (Docker), caching (Redis), CI/CD, and project integration.
- 90-Day: Long-term cloud deployment (GCP/Firebase), live demo launch, program certificate completion (15/18 credits), and ATS-optimized job application.

Output MUST be strictly valid JSON conforming to the schema.`
  }
};

module.exports = {
  CONFIG,
  validateLLMConfig,
  PROFILE_JSON_SCHEMA,
  RESUME_BUILDER_JSON_SCHEMA,
  ATS_AUDITOR_JSON_SCHEMA,
  ACADEMIC_GAP_FILLER_JSON_SCHEMA,
  PROMPTS
};
