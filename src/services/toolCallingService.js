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
const TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'getUserProfile',
      description: 'Lấy thông tin hồ sơ sinh viên của người dùng hiện tại (họ tên, MSSV, trường, khoa/ngành, niên khóa, vai trò, email).',
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
      description: 'Lấy kết quả các bài test hướng nghiệp của người dùng hiện tại, bao gồm Holland RIASEC Code, điểm phù hợp ngành nghề, thế mạnh nổi trội, và kết quả đề xuất khoa/phòng lab.',
      parameters: {
        type: 'object',
        properties: {
          testType: {
            type: 'string',
            enum: ['all', 'holland', 'lab', 'careerFit'],
            description: 'Loại bài test cần xem (mặc định: all)'
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
      description: 'Lấy thông tin CV và kết quả chấm điểm ATS履歷 của người dùng hiện tại (điểm tổng, điểm định lượng Google XYZ, độ hoàn thiện, từ khóa ATS, các khuyến nghị hành động).',
      parameters: {
        type: 'object',
        properties: {
          includeContent: {
            type: 'boolean',
            description: 'Có lấy toàn bộ nội dung Markdown của CV không (mặc định: false)'
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
      description: 'Lấy trạng thái tài khoản của người dùng (tài khoản đang hoạt động hay bị khóa, ngày tham gia, lần đăng nhập gần nhất).',
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
      message: 'Người dùng chưa đăng nhập. Hệ thống yêu cầu đăng nhập để truy cập thông tin cá nhân.'
    };
  }

  const userId = String(authenticatedUserId);

  try {
    switch (toolName) {
      case 'getUserProfile': {
        const user = await findUserSafely(userId);
        if (!user) {
          return { status: 'not_found', message: 'Không tìm thấy hồ sơ người dùng trong hệ thống.' };
        }

        return {
          status: 'success',
          profile: {
            name: user.name || user.displayName || 'Chưa đặt tên',
            email: user.email || 'Chưa cung cấp',
            studentId: user.studentId || 'Chưa cung cấp',
            school: user.school || '靜宜大學 (Providence University)',
            department: user.department || user.dept || 'Chưa xác định',
            grade: user.grade || 'Chưa xác định',
            role: user.role || 'user',
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
            hollandCode: legacyBrand?.hollandCode || userBrand?.topHollandCode || user?.hollandCode || 'Chưa làm bài test',
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
            recommendedDept: legacyLab?.recommendedDept || userLab?.dept || 'Chưa làm bài test',
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
            message: 'Người dùng chưa thực hiện chẩn đoán hoặc tạo CV nào trên hệ thống.'
          };
        }

        const data = {
          hasResume: true,
          title: latestResume.title || 'AI 智能履歷',
          targetRole: latestResume.targetRole || 'Chưa chọn',
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
          return { status: 'not_found', message: 'Không tìm thấy tài khoản người dùng.' };
        }

        return {
          status: 'success',
          accountStatus: {
            isActive: user.isActive !== false,
            role: user.role || 'user',
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt || null
          }
        };
      }

      default:
        return {
          error: 'UNKNOWN_TOOL',
          message: `Công cụ ${toolName} không tồn tại trong hệ thống.`
        };
    }
  } catch (err) {
    console.error(`[ToolCallingService] Lỗi khi thực thi ${toolName}:`, err);
    return {
      error: 'EXECUTION_FAILED',
      message: `Lỗi khi lấy dữ liệu: ${err.message}`
    };
  }
}

module.exports = {
  TOOLS_DEFINITIONS,
  executeTool
};
