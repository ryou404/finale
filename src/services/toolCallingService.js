/**
 * Tool Calling Service
 * Provides secure, verified tools for the RAG LLM to query private user-specific data.
 * CRITICAL SECURITY: Strictly scopes all queries to authenticatedUserId to prevent data leaks.
 */

const { User } = require('../db/models/User');
const { BrandTestResult, CareerFitResult, LabRecommendationResult } = require('../db/models/LegacyResults');

/**
 * OpenAI-compatible tool specifications
 */
/**
 * OpenAI-compatible tool specifications
 */
const TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'getUserProfile',
      description: '取得當前已驗證使用者的個人檔案 (姓名、UID/學號、學校、系所、年級、角色權限、Email) / Retrieve authenticated current user profile',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getUserTestResults',
      description: '取得當前已驗證使用者的職涯測驗結果 (Holland RIASEC 碼、適合科系與推薦實驗室、優勢分析) / Retrieve career test results for authenticated user',
      parameters: {
        type: 'object',
        properties: {
          testType: {
            type: 'string',
            enum: ['all', 'holland', 'lab', 'careerFit'],
            description: '測驗類型 / Test type to retrieve (default: all)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getUserResumeAndCV',
      description: '取得當前已驗證使用者的 CV 與 AI ATS 履歷評分報告 (總分、Google XYZ 量化指標、關鍵字、行動建議) / Retrieve resume ATS diagnosis for authenticated user',
      parameters: {
        type: 'object',
        properties: {
          includeContent: {
            type: 'boolean',
            description: '是否包含 CV Markdown 全文 / Whether to include full Markdown content (default: false)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getUserAccountStatus',
      description: '取得當前使用者的帳號啟用狀態、註冊與最後活動時間 / Retrieve user account active status and registration time',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
];

/**
 * Helper to safely find user by uid or _id
 */
async function findUserSafely(userId) {
  if (!userId) return null;
  const user = await User.findOne({
    $or: [{ uid: String(userId) }, { _id: userId.length === 24 ? userId : null }]
  }).lean();
  return user;
}

/**
 * Execute tool call with strict authenticatedUserId enforcement
 * @param {string} toolName
 * @param {Object} args
 * @param {string|null} authenticatedUserId
 */
async function executeTool(toolName, args = {}, authenticatedUserId = null) {
  if (!authenticatedUserId) {
    return {
      error: 'UNAUTHENTICATED',
      message: '使用者尚未登入，無法存取個人機密資料。(User not authenticated)'
    };
  }

  const userId = String(authenticatedUserId);

  try {
    switch (toolName) {
      case 'getUserProfile': {
        const user = await findUserSafely(userId);
        if (!user) {
          return { status: 'not_found', message: '查無該用戶個人檔案資料。(User profile not found)' };
        }

        return {
          status: 'success',
          profile: {
            name: user.name || user.displayName || user.username || '同學',
            username: user.username || '無',
            email: user.email || '未提供',
            studentId: user.studentId || user.uid,
            school: user.school || '靜宜大學 (Providence University)',
            department: user.department || user.dept || '未設定',
            grade: user.grade || '未設定',
            role: user.role === 'admin' ? '系統超級管理員 (Super Admin)' : '一般學生 (Student)',
            isActive: user.isActive !== false,
            topStrengths: user.summary_cache?.brand?.topStrengths || []
          }
        };
      }

      case 'getUserTestResults': {
        const user = await findUserSafely(userId);
        const { testType = 'all' } = args;
        const results = {};

        if (testType === 'all' || testType === 'holland') {
          const legacyBrand = await BrandTestResult.findOne({ userId }).sort({ completedAt: -1 }).lean();
          const userBrand = user?.brand_results?.latest || user?.summary_cache?.brand;

          results.holland = {
            hollandCode: legacyBrand?.hollandCode || userBrand?.topHollandCode || user?.hollandCode || '尚未進行測驗',
            fitScore: legacyBrand?.maxFit || userBrand?.fitScore || 0,
            bestDepartment: legacyBrand?.bestDept || '',
            topStrengths: legacyBrand?.topStrengths || userBrand?.topStrengths || [],
            completedAt: legacyBrand?.completedAt || userBrand?.date || null
          };
        }

        if (testType === 'all' || testType === 'lab') {
          const legacyLab = await LabRecommendationResult.findOne({ userId }).sort({ completedAt: -1 }).lean();
          const userLab = user?.summary_cache?.lab;

          results.labRecommendation = {
            recommendedDept: legacyLab?.recommendedDept || userLab?.dept || '尚未進行測驗',
            recommendedDeptName: legacyLab?.recommendedDeptName || userLab?.deptName || '',
            recommendedLabs: legacyLab?.recommendedLabs || [],
            description: legacyLab?.recommendationDescription || '',
            completedAt: legacyLab?.completedAt || userLab?.date || null
          };
        }

        if (testType === 'all' || testType === 'careerFit') {
          const legacyFit = await CareerFitResult.findOne({ userId }).sort({ completedAt: -1 }).lean();
          if (legacyFit) {
            results.careerFit = {
              totalScore: legacyFit.totalScore,
              strengths: legacyFit.strengths || [],
              weaknesses: legacyFit.weaknesses || [],
              recommendations: legacyFit.recommendations || [],
              completedAt: legacyFit.completedAt
            };
          }
        }

        return {
          status: 'success',
          testResults: results
        };
      }

      case 'getUserResumeAndCV': {
        const user = await findUserSafely(userId);
        const latestResume = user?.resume_data?.latest;
        const { includeContent = false } = args;

        if (!latestResume || (!latestResume.scores?.total && !latestResume.formattedResumeMarkdown)) {
          return {
            status: 'success',
            hasResume: false,
            message: '目前尚未在系統中進行過 AI 履歷健檢或建立 CV。(No resume diagnosis on record)'
          };
        }

        const data = {
          hasResume: true,
          title: latestResume.title || 'AI 智能履歷',
          targetRole: latestResume.targetRole || '未指定',
          scores: {
            total: latestResume.scores?.total || 0,
            program: latestResume.scores?.program || 0,
            experience: latestResume.scores?.exp || 0,
            skills: latestResume.scores?.skill || 0
          },
          atsMetrics: {
            quantifiability: latestResume.metrics?.quantifiability || 0,
            completeness: latestResume.metrics?.completeness || 0,
            keywordRelevance: latestResume.metrics?.keywordRelevance || 0
          },
          actionItems: latestResume.actionItems || [],
          analysisSummary: latestResume.analysis ? latestResume.analysis.replace(/<[^>]*>/g, '').slice(0, 300) : '',
          updatedAt: latestResume.updatedAt
        };

        if (includeContent && latestResume.formattedResumeMarkdown) {
          data.formattedResumeMarkdown = latestResume.formattedResumeMarkdown.slice(0, 3000);
        }

        return {
          status: 'success',
          resumeData: data
        };
      }

      case 'getUserAccountStatus': {
        const user = await findUserSafely(userId);
        if (!user) {
          return { status: 'not_found', message: '查無該用戶帳號。(User account not found)' };
        }

        return {
          status: 'success',
          accountStatus: {
            isActive: user.isActive !== false,
            role: user.role === 'admin' ? '系統超級管理員 (Super Admin)' : '一般學生 (Student)',
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt || null
          }
        };
      }

      default:
        return {
          error: 'UNKNOWN_TOOL',
          message: `未知的工具指令: ${toolName}`
        };
    }
  } catch (err) {
    console.error(`[ToolCallingService] Error executing ${toolName}:`, err);
    return {
      error: 'EXECUTION_FAILED',
      message: `資料存取發生錯誤: ${err.message}`
    };
  }
}

module.exports = {
  TOOLS_DEFINITIONS,
  executeTool
};
