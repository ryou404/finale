const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User } = require('../db/models/User');
const { Professor } = require('../db/models/Professor');
const { AuditLog } = require('../db/models/AuditLog');
const { BrandTestResult, CareerFitResult, LabRecommendationResult } = require('../db/models/LegacyResults');

/**
 * Helper: Find user by UID or MongoDB _id or Username
 */
async function findUserFlexible(identifier) {
  if (!identifier) return null;
  let user = await User.findOne({ uid: identifier });
  if (!user && mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier);
  }
  if (!user) {
    user = await User.findOne({ username: identifier });
  }
  return user;
}

const bcrypt = require('bcryptjs');
const multer = require('multer');
const { OtpToken } = require('../db/models/OtpToken');
const { generateOTP, sendOtpEmail } = require('../services/emailService');
const { uploadAvatarToR2, getFileFromR2, checkR2Status } = require('../services/r2Service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片檔案 (JPG, PNG, WEBP, GIF)'));
    }
  }
});

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  const visible = name.length <= 2 ? name : name.substring(0, 2) + '***';
  return `${visible}@${domain}`;
}

const { Resource } = require('../db/models/Resource');
const { UploadedFile } = require('../db/models/UploadedFile');

/**
 * 0. Auth APIs (MongoDB Atlas Direct Authentication with Passwords & Email Verification)
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ status: 'error', message: '請輸入電子信箱或使用者名稱' });
    }
    if (!password) {
      return res.status(400).json({ status: 'error', message: '請輸入登入密碼' });
    }

    const trimmedId = identifier.trim();
    let user = await User.findOne({
      $or: [
        { email: trimmedId.toLowerCase() },
        { username: trimmedId },
        { name: trimmedId },
        { uid: trimmedId }
      ]
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '帳號不存在，請確認輸入或切換至註冊頁面！'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        status: 'error',
        message: '您的帳號已被停用，請聯繫系統管理員！'
      });
    }

    // Verify Password
    if (user.password && user.password.length > 0) {
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = (password === user.password);
      }

      if (!isMatch) {
        return res.status(401).json({ status: 'error', message: '密碼不正確，請重新輸入！' });
      }
    } else {
      // If user had no password yet, set this as their password
      user.password = await bcrypt.hash(password, 10);
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ status: 'ok', message: '登入成功', user });
  } catch (err) {
    console.error('[API /auth/login error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 0.1 Register Step 1: Send Email OTP Verification Code
 */
router.post('/auth/register-request', async (req, res) => {
  try {
    const { username, password, email, name, school, department, grade } = req.body || {};
    
    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: '請輸入姓名 / 暱稱' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ status: 'error', message: '請輸入使用者帳號名稱' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: 'error', message: '請輸入有效的電子信箱以接收驗證碼' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ status: 'error', message: '密碼長度至少需 4 個字元' });
    }

    const targetUsername = username.trim();
    const targetEmail = email.trim().toLowerCase();

    // Check if username or email is already registered
    const existing = await User.findOne({
      $or: [
        { username: targetUsername },
        { email: targetEmail }
      ]
    });

    if (existing) {
      const msg = existing.username === targetUsername
        ? '此帳號名稱已被使用，請選擇其他名稱！'
        : '此電子信箱已被註冊，請直接登入或使用忘記密碼功能！';
      return res.status(409).json({ status: 'error', message: msg });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();

    // Delete any old pending registration OTP for this email
    await OtpToken.deleteMany({ email: targetEmail, type: 'register' });

    // Save pending OTP record (TTL 10 mins)
    await OtpToken.create({
      email: targetEmail,
      code: otpCode,
      type: 'register',
      tempData: {
        username: targetUsername,
        name: name.trim(),
        password: hashedPassword,
        email: targetEmail,
        school: school || '靜宜大學',
        department: department || 'IM',
        dept: department || 'IM',
        grade: grade || '大三'
      }
    });

    // Send verification email
    const sendResult = await sendOtpEmail(targetEmail, otpCode, 'register', name.trim());

    if (sendResult && sendResult.success) {
      res.json({
        status: 'ok',
        message: `驗證碼已發送至信箱 ${maskEmail(targetEmail)}，請檢查收件匣！`,
        email: targetEmail,
        maskedEmail: maskEmail(targetEmail)
      });
    } else {
      console.warn(`[API /auth/register-request] SMTP network blocked by Render free tier. Activating instant verification fallback.`);
      console.info(`🔑 ==========================================`);
      console.info(`🔑 [RENDER OTP VERIFICATION CODE]: ${otpCode} for ${targetEmail}`);
      console.info(`🔑 ==========================================`);
      
      res.json({
        status: 'ok',
        isSimulated: true,
        debugOtp: otpCode,
        message: `【Render 雲端模式】驗證碼已生成：${otpCode} (已自動為您填入)`,
        email: targetEmail,
        maskedEmail: maskEmail(targetEmail)
      });
    }
  } catch (err) {
    console.error('[API /auth/register-request error]:', err);
    res.status(500).json({ status: 'error', message: '無法發送驗證郵件：' + err.message });
  }
});

/**
 * 0.2 Register Step 2: Verify OTP & Create User in MongoDB Atlas
 */
router.post('/auth/register-verify', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: '請輸入電子信箱與 OTP 驗證碼' });
    }

    const targetEmail = email.trim().toLowerCase();
    const targetCode = code.trim();

    const otpDoc = await OtpToken.findOne({
      email: targetEmail,
      code: targetCode,
      type: 'register'
    });

    if (!otpDoc) {
      return res.status(400).json({
        status: 'error',
        message: '驗證碼不正確或已過期，請重新嘗試！'
      });
    }

    const tempData = otpDoc.tempData;
    const uniqueId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const user = await User.create({
      uid: uniqueId,
      username: tempData.username,
      name: tempData.name,
      password: tempData.password,
      email: targetEmail,
      school: tempData.school,
      department: tempData.department,
      dept: tempData.dept,
      grade: tempData.grade
    });

    // Clean up OTP token
    await OtpToken.deleteMany({ email: targetEmail, type: 'register' });

    res.json({
      status: 'ok',
      message: '信箱驗證成功！您的帳號已順利啟用。',
      user
    });
  } catch (err) {
    console.error('[API /auth/register-verify error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 0.3 Forgot Password Step 1: Send Reset OTP Code
 */
router.post('/auth/forgot-request', async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ status: 'error', message: '請輸入已註冊的使用者帳號或電子信箱' });
    }

    const trimmedId = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: trimmedId.toLowerCase() },
        { username: trimmedId },
        { name: trimmedId }
      ]
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '查無此帳號資料，請再次確認！'
      });
    }

    if (!user.email || !user.email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: '此帳號未綁定電子信箱，請聯繫管理員協助處理！'
      });
    }

    const otpCode = generateOTP();

    // Delete any old forgot password OTP for this email
    await OtpToken.deleteMany({ email: user.email.toLowerCase(), type: 'forgot_password' });

    // Save OTP token
    await OtpToken.create({
      email: user.email.toLowerCase(),
      code: otpCode,
      type: 'forgot_password',
      tempData: { userId: user._id, username: user.username }
    });

    // Send reset email
    const sendResult = await sendOtpEmail(user.email.toLowerCase(), otpCode, 'forgot_password', user.name || user.username);

    if (sendResult && sendResult.success) {
      res.json({
        status: 'ok',
        message: `密碼重設驗證碼已發送至 ${maskEmail(user.email)}，請檢查收件匣！`,
        email: user.email.toLowerCase(),
        maskedEmail: maskEmail(user.email)
      });
    } else {
      console.warn(`[API /auth/forgot-request] SMTP network blocked by Render free tier. Activating instant verification fallback.`);
      console.info(`🔑 ==========================================`);
      console.info(`🔑 [RENDER OTP RESET CODE]: ${otpCode} for ${user.email}`);
      console.info(`🔑 ==========================================`);

      res.json({
        status: 'ok',
        isSimulated: true,
        debugOtp: otpCode,
        message: `【Render 雲端模式】重設代碼為：${otpCode} (已自動為您填入)`,
        email: user.email.toLowerCase(),
        maskedEmail: maskEmail(user.email)
      });
    }
  } catch (err) {
    console.error('[API /auth/forgot-request error]:', err);
    res.status(500).json({ status: 'error', message: '無法發送密碼重設郵件：' + err.message });
  }
});

/**
 * 0.4 Forgot Password Step 2: Verify OTP & Update Password
 */
router.post('/auth/forgot-verify-reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ status: 'error', message: '請完整填寫電子信箱、驗證碼與新密碼' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ status: 'error', message: '新密碼長度至少需 4 個字元' });
    }

    const targetEmail = email.trim().toLowerCase();
    const targetCode = code.trim();

    const otpDoc = await OtpToken.findOne({
      email: targetEmail,
      code: targetCode,
      type: 'forgot_password'
    });

    if (!otpDoc) {
      return res.status(400).json({
        status: 'error',
        message: '密碼重設驗證碼錯誤或已過期！'
      });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '查無對應使用者' });
    }

    // Update password with new bcrypt hash
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Remove used OTP
    await OtpToken.deleteMany({ email: targetEmail, type: 'forgot_password' });

    res.json({
      status: 'ok',
      message: '密碼重設成功！您現在可以使用新密碼登入。',
      user
    });
  } catch (err) {
    console.error('[API /auth/forgot-verify-reset error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 0.5 Resend OTP Code
 */
router.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: 'error', message: '電子信箱格式不正確' });
    }

    const targetEmail = email.trim().toLowerCase();
    const otpType = type === 'forgot_password' ? 'forgot_password' : 'register';

    const existingOtp = await OtpToken.findOne({ email: targetEmail, type: otpType });
    if (!existingOtp) {
      return res.status(404).json({ status: 'error', message: '驗證階段已過期，請重新發送！' });
    }

    const newCode = generateOTP();
    existingOtp.code = newCode;
    existingOtp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingOtp.save();

    const sendResult = await sendOtpEmail(targetEmail, newCode, otpType);

    if (sendResult && sendResult.success) {
      res.json({
        status: 'ok',
        message: `新的 OTP 驗證碼已重新發送至 ${maskEmail(targetEmail)}`
      });
    } else {
      res.json({
        status: 'ok',
        isSimulated: true,
        debugOtp: newCode,
        message: `【Render 雲端模式】新驗證碼已生成：${newCode} (已自動為您填入)`
      });
    }
  } catch (err) {
    console.error('[API /auth/resend-otp error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/auth/users-list', async (req, res) => {
  try {
    const users = await User.find({}, 'uid username name email department school grade').limit(10).sort({ updatedAt: -1 });
    res.json({ status: 'ok', users });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 1. Database Health Check & Detailed Collection Stats
 */
router.get('/db/status', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const stats = {
      connected: isConnected,
      dbName: mongoose.connection.name || 'career',
      host: mongoose.connection.host || 'none',
      usersCount: isConnected ? await User.countDocuments() : 0,
      brandResultsCount: isConnected ? await BrandTestResult.countDocuments() : 0,
      careerFitResultsCount: isConnected ? await CareerFitResult.countDocuments() : 0,
      labResultsCount: isConnected ? await LabRecommendationResult.countDocuments() : 0,
      professorsCount: isConnected ? await Professor.countDocuments() : 0,
      resourcesCount: isConnected ? await Resource.countDocuments() : 0,
      uploadedFilesCount: isConnected ? await UploadedFile.countDocuments() : 0,
      auditLogsCount: isConnected ? await AuditLog.countDocuments() : 0
    };
    res.json({ status: 'ok', database: stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 2. Get User by UID or _id
 */
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    let user = await findUserFlexible(uid);
    if (!user) {
      // Auto create skeleton for guest or new user
      user = await User.create({ uid, name: '新朋友', department: 'IM' });
    }
    res.json({ status: 'ok', user });
  } catch (err) {
    console.error('[API /users/:uid error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. Sync / Upsert User Document (Deep Merge)
 */
router.post('/users/sync', async (req, res) => {
  try {
    const { uid, ...data } = req.body || {};
    if (!uid) {
      return res.status(400).json({ status: 'error', message: 'Missing uid in payload' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { $or: [{ uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      { $set: { uid, ...data } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ status: 'ok', user: updatedUser });
  } catch (err) {
    console.error('[API /users/sync error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 4. Update Profile Specific Fields
 */
router.put('/users/:uid/profile', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, displayName, school, department, dept, grade, skills, settings } = req.body || {};
    
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (school !== undefined) updateFields.school = school;
    if (department !== undefined) updateFields.department = department;
    if (dept !== undefined) updateFields.dept = dept;
    if (grade !== undefined) updateFields.grade = grade;
    if (skills !== undefined) updateFields.skills = skills;
    if (settings !== undefined) updateFields.settings = settings;
    updateFields.updatedAt = new Date();

    const user = await User.findOneAndUpdate(
      { $or: [
        { uid }, 
        { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null },
        { email: uid },
        { username: uid }
      ] },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ status: 'ok', user });
  } catch (err) {
    console.error('[API /users/:uid/profile error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 5. Save Brand / Holland Test Snapshot (Dual-collection sync)
 */
router.post('/users/:uid/brand', async (req, res) => {
  try {
    const { uid } = req.params;
    const brandData = req.body || {};
    const dateStr = brandData.date || new Date().toISOString();

    const snapshot = {
      date: dateStr,
      topHollandCode: brandData.topHollandCode || brandData.hollandCode || '',
      fitScore: brandData.fitScore || brandData.maxFit || 0,
      hollandCode: brandData.hollandCode || brandData.topHollandCode || '',
      topStrengths: Array.isArray(brandData.topStrengths) ? brandData.topStrengths : [],
      radarData: Array.isArray(brandData.radarData) ? brandData.radarData : [],
      hollandScores: brandData.hollandScores || [],
      ucan: brandData.ucan || ''
    };

    // 1. Create record in dedicated brand_test_results collection
    const brandDoc = await BrandTestResult.create({
      userId: uid,
      testType: 'brand',
      hollandCode: snapshot.hollandCode,
      bestDept: brandData.bestDept || '',
      maxFit: snapshot.fitScore,
      topHolland: brandData.topHolland || snapshot.hollandScores,
      topStrengths: snapshot.topStrengths,
      radarData: snapshot.radarData,
      resumeDraft: brandData.resumeDraft || '',
      answers: brandData.answers || {}
    });

    // 2. Update user document
    const user = await User.findOneAndUpdate(
      { $or: [{ uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      {
        $set: {
          hollandCode: snapshot.hollandCode,
          brandTestResult: brandDoc._id,
          'brand_results.latest': snapshot,
          'summary_cache.brand': {
            date: dateStr,
            topHollandCode: snapshot.topHollandCode,
            fitScore: snapshot.fitScore,
            topStrengths: snapshot.topStrengths.map(s => typeof s === 'object' ? (s.name || s.code) : s)
          }
        },
        $push: { history_brand: snapshot }
      },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ status: 'ok', brand: snapshot, brandDocId: brandDoc._id, user });
  } catch (err) {
    console.error('[API /users/:uid/brand error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 6. Get Latest Brand Result
 */
router.get('/users/:uid/brand', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await findUserFlexible(uid);
    let latestBrand = user?.brand_results?.latest || null;
    
    if (!latestBrand || !latestBrand.topHollandCode) {
      // Fallback to query brand_test_results
      const legacyDoc = await BrandTestResult.findOne({ userId: uid }).sort({ createdAt: -1 });
      if (legacyDoc) {
        latestBrand = {
          topHollandCode: legacyDoc.hollandCode,
          hollandCode: legacyDoc.hollandCode,
          fitScore: legacyDoc.maxFit,
          topStrengths: legacyDoc.topStrengths,
          radarData: legacyDoc.radarData,
          date: legacyDoc.createdAt?.toISOString()
        };
      }
    }
    res.json({ status: 'ok', brand: latestBrand });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7. Save Resume Data / Career Fit Snapshot (Dual-collection sync)
 */
router.post('/users/:uid/resume', async (req, res) => {
  try {
    const { uid } = req.params;
    const resumeData = req.body || {};
    const updatedAtStr = resumeData.updatedAt || new Date().toISOString();

    const snapshot = {
      title: resumeData.title || (resumeData.targetRole ? `${resumeData.targetRole} 履歷` : 'AI 智能履歷'),
      templateId: resumeData.templateId || 'modern',
      selectedCourses: Array.isArray(resumeData.selectedCourses) ? resumeData.selectedCourses : [],
      selectedExps: Array.isArray(resumeData.selectedExps) ? resumeData.selectedExps : [],
      skills: resumeData.skills || [],
      scores: resumeData.scores || { total: 0, program: 0, exp: 0, skill: 0 },
      metrics: resumeData.metrics || { quantifiability: 75, completeness: 80, keywordRelevance: 70 },
      targetRole: resumeData.targetRole || '',
      rawDraft: resumeData.rawDraft || '',
      analysis: resumeData.analysis || '',
      actionItems: Array.isArray(resumeData.actionItems) ? resumeData.actionItems : [],
      formattedResumeMarkdown: resumeData.formattedResumeMarkdown || resumeData.resumeMarkdown || '',
      cvData: resumeData.cvData || {},
      updatedAt: updatedAtStr
    };

    // 1. Create record in dedicated career_fit_results collection
    const careerFitDoc = await CareerFitResult.create({
      userId: uid,
      testType: 'careerFit',
      totalScore: snapshot.scores.total || snapshot.metrics.quantifiability || 0,
      dimensions: snapshot.metrics,
      strengths: resumeData.strengths || [],
      actionPlan: snapshot.actionItems,
      answers: {
        selectedCourses: snapshot.selectedCourses,
        selectedExps: snapshot.selectedExps
      }
    });

    // 2. Fetch user to check for rapid duplicate submissions (< 15 seconds)
    let user = await findUserFlexible(uid);
    if (!user) {
      user = await User.create({ uid, name: '用戶' });
    }

    user.careerFitResult = careerFitDoc._id;
    user.resume_data = user.resume_data || {};
    user.resume_data.latest = snapshot;
    user.summary_cache = user.summary_cache || {};
    user.summary_cache.resume = {
      updatedAt: updatedAtStr,
      totalScore: snapshot.scores.total || snapshot.metrics.quantifiability || 0
    };

    user.history_resume = user.history_resume || [];
    const lastHistoryItem = user.history_resume.length > 0 ? user.history_resume[user.history_resume.length - 1] : null;
    const nowTime = new Date(updatedAtStr).getTime();
    const lastTime = lastHistoryItem?.updatedAt ? new Date(lastHistoryItem.updatedAt).getTime() : 0;
    
    // If last history entry was added within 15 seconds, replace it to prevent duplicates
    if (lastHistoryItem && Math.abs(nowTime - lastTime) < 15000) {
      user.history_resume[user.history_resume.length - 1] = snapshot;
    } else {
      user.history_resume.push(snapshot);
    }

    await user.save();

    res.json({ status: 'ok', resume: snapshot, careerFitDocId: careerFitDoc._id, user });
  } catch (err) {
    console.error('[API /users/:uid/resume error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7.1 Get Latest Resume & All Saved Resume History
 */
router.get('/users/:uid/resume', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await findUserFlexible(uid);
    const latest = user?.resume_data?.latest || null;
    const history = user?.history_resume || [];
    res.json({ status: 'ok', resume: latest, history });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/users/:uid/resumes', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await findUserFlexible(uid);
    const history = user?.history_resume || [];
    res.json({ status: 'ok', resumes: history.slice().reverse() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7.2 Delete a Saved Resume from History
 */
router.delete('/users/:uid/resumes/:resumeId', async (req, res) => {
  try {
    const { uid, resumeId } = req.params;
    const user = await findUserFlexible(uid);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    user.history_resume = user.history_resume.filter(r => {
      if (r._id && String(r._id) === resumeId) return false;
      if (r.updatedAt && r.updatedAt === resumeId) return false;
      return true;
    });

    await user.save();
    res.json({ status: 'ok', message: '履歷紀錄已成功刪除', resumes: user.history_resume.slice().reverse() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 8. Save Lab Recommendation Snapshot (Dual-collection sync)
 */
router.post('/users/:uid/lab', async (req, res) => {
  try {
    const { uid } = req.params;
    const labData = req.body || {};
    const dateStr = labData.date || new Date().toISOString();

    const snapshot = {
      dept: labData.dept || '',
      deptName: labData.deptName || '',
      date: dateStr,
      scores: labData.scores || {}
    };

    // 1. Create record in dedicated lab_recommendation_results collection
    const labDoc = await LabRecommendationResult.create({
      userId: uid,
      testType: 'labRecommendation',
      recommendedDept: snapshot.dept,
      recommendedDeptName: snapshot.deptName,
      scores: snapshot.scores,
      answers: labData.answers || {}
    });

    // 2. Update user document
    const user = await User.findOneAndUpdate(
      { $or: [{ uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      {
        $set: {
          labRecommendationResult: labDoc._id,
          'summary_cache.lab': {
            dept: snapshot.dept,
            deptName: snapshot.deptName,
            date: dateStr
          }
        },
        $push: { history_lab: snapshot }
      },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ status: 'ok', lab: snapshot, labDocId: labDoc._id, user });
  } catch (err) {
    console.error('[API /users/:uid/lab error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 9. Faculty & Professors API
 */
router.get('/professors', async (req, res) => {
  try {
    const { dept } = req.query;
    const filter = dept ? { department: dept.toUpperCase() } : {};
    let professors = await Professor.find(filter);
    
    // Auto-seed if collection is empty
    if (professors.length === 0 && !dept) {
      const defaultProfessors = [
        {
          name: "陳教授",
          title: "特聘教授 / 實驗室主持人",
          department: "CS",
          labName: "物聯網與分散式系統實驗室 (IoT & Distributed Systems Lab)",
          researchFields: ["IoT", "Edge Computing", "Cybersecurity", "Network Architecture"],
          email: "prof_chen@pu.edu.tw",
          office: "主顧樓 412 室",
          bio: "專注於智慧物聯網邊緣運算與輕量化安全協定研發，近年與台積電、光寶科技密切產學合作。"
        },
        {
          name: "林主任",
          title: "系主任 / 教授",
          department: "IM",
          labName: "商業智慧與大數據決策實驗室 (BI & Data Analytics Lab)",
          researchFields: ["Data Warehousing", "ERP Systems", "Business Intelligence", "FinTech"],
          email: "prof_lin@pu.edu.tw",
          office: "主顧樓 308 室",
          bio: "深耕企業資源規劃 (ERP) 與金融大數據預測分析，主持鼎新電腦產學合作專案。"
        },
        {
          name: "張博士",
          title: "副教授 / AI實驗室負責人",
          department: "AI",
          labName: "電腦視覺與深度學習實驗室 (Computer Vision & Deep Learning Lab)",
          researchFields: ["Computer Vision", "Deep Learning", "Generative AI", "Medical Imaging"],
          email: "prof_chang@pu.edu.tw",
          office: "主顧樓 518 室",
          bio: "專攻生成式 AI 與智慧醫療影像診斷，曾獲國科會優秀年輕學者研究計畫。"
        }
      ];
      professors = await Professor.insertMany(defaultProfessors);
    }
    
    res.json({ status: 'ok', count: professors.length, professors });
  } catch (err) {
    console.error('[API /professors error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7. Cloudflare R2 Avatar Upload & File Proxy
 */
router.post('/users/:uid/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { uid } = req.params;
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '請選擇一張頭像圖片檔案！' });
    }

    const { key, url } = await uploadAvatarToR2(req.file.buffer, req.file.mimetype, uid, req.file.originalname);
    
    // Update User in MongoDB Atlas
    let user = await User.findOneAndUpdate(
      { $or: [{ uid }, { username: uid }, { email: uid }] },
      { $set: { photoURL: url, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!user && mongoose.Types.ObjectId.isValid(uid)) {
      user = await User.findByIdAndUpdate(uid, { $set: { photoURL: url, updatedAt: new Date() } }, { returnDocument: 'after' });
    }

    return res.json({
      status: 'ok',
      message: '頭像已成功上傳至 Cloudflare R2！',
      photoURL: url,
      key,
      user
    });
  } catch (err) {
    console.error('[API /users/:uid/avatar error]:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * Cloudflare R2 File Proxy Streamer
 */
router.get('/r2/file/*', async (req, res) => {
  try {
    const key = req.params[0];
    if (!key) return res.status(400).send('Missing file key');
    const { body, contentType, contentLength } = await getFileFromR2(key);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    if (body.pipe) {
      body.pipe(res);
    } else {
      const chunks = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      res.end(Buffer.concat(chunks));
    }
  } catch (err) {
    console.error('[API /r2/file error]:', err.message);
    return res.status(404).send('File not found or unable to fetch from R2');
  }
});

/**
 * 8. Public Learning Resources API (Connected to MongoDB)
 */
router.get('/resources', async (req, res) => {
  try {
    const { dept, category, grade, search } = req.query;
    const query = { isActive: { $ne: false } };

    if (dept && dept !== 'all') {
      const cleanDept = dept.replace('學系', '').replace('系', '');
      query.departments = { $regex: cleanDept, $options: 'i' };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (grade && grade !== 'all') {
      const gradeNum = parseInt(grade);
      if (!isNaN(gradeNum)) {
        query.grades = gradeNum;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { tags: regex }
      ];
    }

    let resources = await Resource.find(query).sort({ featured: -1, createdAt: -1 });

    // Format for frontend compatibility
    const formatted = resources.map(r => {
      let files = r.files && r.files.length > 0 ? r.files : [];
      let links = r.links && r.links.length > 0 ? r.links : [];

      if (files.length === 0 && r.fileKey) {
        files = [{
          name: r.fileName || 'attachment',
          url: r.url,
          key: r.fileKey,
          size: r.fileSize || 0,
          mimeType: r.fileMimeType || ''
        }];
      }

      if (links.length === 0 && r.url && !r.fileKey) {
        links = [{
          title: '訪問資源 (Official Link)',
          url: r.url,
          type: 'link'
        }];
      }

      return {
        id: r.resourceId || String(r._id),
        resourceId: r.resourceId || String(r._id),
        title: r.title,
        category: r.category,
        type: r.type,
        departments: r.departments || [],
        grades: r.grades || [],
        description: r.description || '',
        content: r.content || '',
        files,
        links,
        url: r.url || (files.length > 0 ? files[0].url : (links.length > 0 ? links[0].url : '')),
        fileKey: r.fileKey || (files.length > 0 ? files[0].key : ''),
        fileName: r.fileName || (files.length > 0 ? files[0].name : ''),
        fileSize: r.fileSize || (files.length > 0 ? files[0].size : 0),
        tags: r.tags || [],
        featured: r.featured || false,
        icon: r.icon || '📚',
        updatedAt: r.updatedAtFormatted || (r.updatedAt ? r.updatedAt.toISOString().substring(0, 7) : '')
      };
    });

    res.json({
      status: 'ok',
      count: formatted.length,
      resources: formatted
    });
  } catch (err) {
    console.error('[API /resources error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get Categories (Must be defined before /resources/:id)
router.get('/resources/categories', async (req, res) => {
  try {
    const Category = require('../db/models/Category');
    const dbCats = await Category.find().sort({ order: 1, createdAt: 1 });

    const categories = [
      { id: 'all', label: '全部資源', labelEn: 'All Resources', icon: '📚', color: 'blue' }
    ];

    if (dbCats && dbCats.length > 0) {
      dbCats.forEach(c => {
        categories.push({
          id: c.name,
          label: c.name,
          labelEn: c.nameEn || c.name,
          icon: c.icon || '📁',
          color: 'indigo',
          description: c.description || ''
        });
      });
    } else {
      // Fallback defaults
      categories.push(
        { id: '學科資源', label: '學科資源', labelEn: 'Academic', icon: '📖', color: 'indigo' },
        { id: '實驗室資訊', label: '實驗室資訊', labelEn: 'Lab Info', icon: '🔬', color: 'purple' },
        { id: '職涯發展', label: '職涯發展', labelEn: 'Career', icon: '💼', color: 'teal' },
        { id: '考試備戰', label: '考試備戰', labelEn: 'Exams', icon: '📋', color: 'amber' },
        { id: '常用工具', label: '常用工具', labelEn: 'Tools', icon: '⚙️', color: 'slate' }
      );
    }

    res.json({ status: 'ok', count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get Single Resource Details by ID (for dedicated detail page)
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Resource.findOne({
      $or: [
        { resourceId: id },
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }
      ]
    });

    if (!r) {
      return res.status(404).json({ status: 'error', message: 'Resource not found' });
    }

    let files = r.files && r.files.length > 0 ? r.files : [];
    let links = r.links && r.links.length > 0 ? r.links : [];

    if (files.length === 0 && r.fileKey) {
      files = [{
        name: r.fileName || 'attachment',
        url: r.url,
        key: r.fileKey,
        size: r.fileSize || 0,
        mimeType: r.fileMimeType || ''
      }];
    }

    if (links.length === 0 && r.url && !r.fileKey) {
      links = [{
        title: '前往官方外部資源',
        url: r.url,
        type: 'link'
      }];
    }

    // Fetch related resources in the same category
    const relatedDocs = await Resource.find({
      category: r.category,
      _id: { $ne: r._id },
      isActive: true
    }).limit(4);

    const related = relatedDocs.map(rel => ({
      id: rel.resourceId || String(rel._id),
      resourceId: rel.resourceId || String(rel._id),
      title: rel.title,
      category: rel.category,
      type: rel.type,
      icon: rel.icon || '📚',
      description: rel.description,
      filesCount: (rel.files && rel.files.length) || (rel.fileKey ? 1 : 0),
      linksCount: (rel.links && rel.links.length) || (rel.url && !rel.fileKey ? 1 : 0)
    }));

    const formatted = {
      id: r.resourceId || String(r._id),
      resourceId: r.resourceId || String(r._id),
      title: r.title,
      category: r.category,
      type: r.type,
      departments: r.departments || [],
      grades: r.grades || [],
      description: r.description || '',
      content: r.content || '',
      files,
      links,
      url: r.url || (files.length > 0 ? files[0].url : (links.length > 0 ? links[0].url : '')),
      fileKey: r.fileKey || (files.length > 0 ? files[0].key : ''),
      fileName: r.fileName || (files.length > 0 ? files[0].name : ''),
      fileSize: r.fileSize || (files.length > 0 ? files[0].size : 0),
      tags: r.tags || [],
      featured: r.featured || false,
      icon: r.icon || '📚',
      updatedAt: r.updatedAtFormatted || (r.updatedAt ? r.updatedAt.toISOString().substring(0, 7) : ''),
      createdAt: r.createdAt
    };

    res.json({
      status: 'ok',
      resource: formatted,
      related
    });
  } catch (err) {
    console.error('[API /resources/:id error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * Direct DeepSeek AI Resume Diagnosis & Generation API
 * Ingests prompt, student context, and optional PDF resume, calls DeepSeek Chat Completions API using backend key.
 */
router.post('/ai/diagnose', async (req, res) => {
  const { CONFIG } = require('../config');
  const { generateDeterministicOutput } = require('../engines/deterministicEngine');
  const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  const baseUrl = CONFIG.api.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const modelName = CONFIG.llm.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const { prompt, pdfBase64, department, grade, draftText, courses, experiences, skills, userInfo } = req.body || {};

  if (!prompt && !draftText) {
    return res.status(400).json({ status: 'error', message: '缺少提示詞或履歷內容' });
  }

  // Build user info context for system prompt
  const userName = userInfo?.name || '未提供';
  const userInfoContext = userInfo ? `\n\n【重要：學生真實個人資料】\n姓名：${userInfo.name || '未提供'}，Email：${userInfo.email || '未提供'}，學校：${userInfo.school || '靜宜大學'}，科系：${userInfo.deptFullName || userInfo.department || '未知'}，年級：${userInfo.grade || '未知'}\n你必須在生成的履歷中使用上述真實資料。如果某項資料為「未提供」，請在履歷中省略該欄位，絕對不可以自行編造假資料。` : '';

  if (apiKey) {
    try {
      const userPrompt = prompt || `請診斷以下履歷內容並輸出標準 JSON 格式的健檢報告與 Markdown 履歷：\n科系：${department || '資管系'}\n年級：${grade || '大四'}\n自述草稿：${draftText || ''}`;

      const messages = [
        {
          role: 'system',
          content: '你是靜宜大學資訊學院專屬的資深人資與 AI 職涯顧問。請客觀且嚴謹地進行履歷 Golden Triangle 三維度檢核，給出具體且誠懇的建議，並只輸出符合格式規範的純 JSON 物件 (不要包含 markdown code block 標記)。格式務必包含: quantifiability (0-100), completeness (0-100), keywordRelevance (0-100), analysis (HTML格式), actionItems (字串陣列), resumeMarkdown (Markdown格式字串)。\n\n【最重要的規則】：你絕對不可以自行編造或虛構學生的姓名、電話、Email、學校等個人資訊。所有個人資料必須使用 Prompt 中提供的真實數據。如果某項個人資料標示為「未提供」，請在履歷中省略該欄位。' + userInfoContext
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      const requestPayload = {
        model: modelName,
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: CONFIG.llm.temperature,
        max_tokens: 4096
      };

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        if (rawContent) {
          const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
          const result = JSON.parse(cleanJson);
          return res.json({
            status: 'ok',
            provider: 'DeepSeek',
            model: data.model || modelName,
            result
          });
        }
      } else {
        const errText = await response.text();
        console.error(`[DeepSeek API Error HTTP ${response.status}]:`, errText);
      }
    } catch (apiErr) {
      console.error('[DeepSeek API Call Exception]:', apiErr.message);
    }
  }

  // Graceful Offline Heuristic Fallback (Ensures user ALWAYS gets a complete report)
  console.log('[AI Diagnose] Triggering Deterministic Fallback Engine...');
  const fallback = generateDeterministicOutput({
    department: department || 'IM',
    grade: grade || '大四',
    completedCourses: Array.isArray(courses) ? courses : [],
    experiences: Array.isArray(experiences) ? experiences : [],
    strengths: Array.isArray(skills) ? skills : [],
    rawDraft: draftText || ''
  });

  res.json({
    status: 'ok',
    provider: 'DeepSeek (Offline Fallback)',
    model: 'deterministic-heuristic-engine',
    isFallback: true,
    result: {
      quantifiability: fallback.atsAudit?.metrics?.quantifiability || 75,
      completeness: fallback.atsAudit?.metrics?.completeness || 80,
      keywordRelevance: fallback.atsAudit?.metrics?.relevance || 70,
      analysis: fallback.atsAudit?.auditSummary || '<p>履歷整體結構清晰，建議增加量化數據與 STAR 句型敘述。</p>',
      actionItems: fallback.academicPlan?.recommendations?.map(r => `建議修習【${r.courseName}】以強化 ${r.teachesSkills.join(', ')} 能力 (${r.reason})`) || [],
      resumeMarkdown: fallback.resume?.formattedResumeMarkdown || ''
    }
  });
});

/**
 * =========================================================================
 * AI CHAT ASSISTANT API (/api/ai/chat)
 * Interactive Assistant for CareerDNA Project Guidance, Web App Q&A & Support
 * =========================================================================
 */
router.post('/ai/chat', async (req, res) => {
  const { CONFIG } = require('../config');
  const apiKey = CONFIG.api.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  const baseUrl = CONFIG.api.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const modelName = CONFIG.llm.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const { messages = [], currentPage = '', userInfo = {} } = req.body || {};

  const systemPrompt = `
你是「CareerDNA AI 智能助手」- 靜宜大學（Providence University）資訊學院 CareerDNA 平台的專屬智能助理。

【核心定位與原則】：
- 請以專業、親切、清晰的語氣回答使用者的所有問題。
- 預設語言為「繁體中文（台灣）」。若使用者以越南文或英文提問，請以該語言親切回覆。
- 請避免使用「畢業專題」、「畢業設計」、「論文」等詞彙；請直接定位為「CareerDNA AI 職涯導航與履歷優化平台」。

【平台核心功能與架構】：
1. **AI 履歷健檢 (career_fit_v2.html)**：
   - 根據 Golden Triangle ATS 國際人資標準（經驗適配度、硬技能密度、Google XYZ 量化成果公式）進行履歷深度診斷。
   - 使用 Micro-STAR (STAR-L) 原則改寫經歷與專案。
   - 提供 3 款 A4 履歷範本切換：經典專業 (Classic)、現代雙欄 (Modern)、極簡科技 (Minimal)。
   - 支援直接匯出 PDF 與高解析度向量列印，並自動典藏至個人檔案。
2. **品牌測驗 (brand_test.html)**：
   - Holland RIASEC 六大職涯性格模型（R 實用、I 研究、A 藝術、S 社交、E 企業、C 常規）與蓋洛普優勢分析，生成六角雷達圖。
3. **科系適配 (lab_recommendation.html)**：
   - 診斷適合靜宜大學資訊學院的三大系所（資訊工程學系 CS、資訊管理學系 IM、人工智慧學系 AI），並提供實驗室與教授研究方向導覽。
4. **個人檔案 (profile.html)**：
   - 管理學歷、專業技能武器庫、上傳 Cloudflare R2 大頭貼。
   - 「AI 履歷典藏庫」：隨時預覽、切換樣式及重新下載歷史生成的 AI 履歷。
5. **學習資源 (resource_library.html)**：
   - 資訊技術學習 Roadmap、精選教材與國際認證資源。

【技術架構】：
- 採用 Multi-Agent 多智能體架構（ProfileAgent、AcademicGapFillerAgent、ResumeBuilderAgent、AtsAuditorAgent、MasterOrchestrator），結合 MongoDB Atlas 資料庫與 Cloudflare R2 高速 CDN。

【目前上下文】：
- 使用者目前瀏覽頁面：${currentPage || 'CareerDNA 平台'}
${userInfo?.name ? `- 當前使用者：${userInfo.name}（${userInfo.school || '靜宜大學'} ${userInfo.department || '資訊學院'} ${userInfo.grade || ''}）` : ''}
`;

  if (apiKey) {
    try {
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content || ''
        }))
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: chatMessages,
          temperature: 0.3,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，我目前無法處理此問題，請稍後再試。';

      return res.json({
        status: 'ok',
        reply: reply,
        model: modelName
      });
    } catch (err) {
      console.error('[API /ai/chat error]:', err);
    }
  }

  // Fallback offline responses in Traditional Chinese
  const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
  let fallbackReply = '您好！我是 **CareerDNA AI 智能助手**，很高興為您服務！😊\n\n我可以協助您：\n' +
    '1. **AI 履歷健檢與生成**：前往 [AI 履歷健檢](career_fit_v2.html)，勾選修課與經歷，一鍵生成並匯出標準 A4 PDF。\n' +
    '2. **查看歷史履歷**：前往 [個人檔案](profile.html) 的「AI 履歷典藏庫」，隨時預覽與切換 3 款樣式。\n' +
    '3. **Holland 職涯測驗**：於 [品牌測驗](brand_test.html) 探索 RIASEC 六大職業性格與蓋洛普優勢。\n' +
    '4. **科系與實驗室導覽**：於 [科系適配](lab_recommendation.html) 探索靜宜資工、資管、AI 三大系所與教授實驗室。\n\n' +
    '請告訴我您想了解哪一項功能？';

  if (lastUserMsg.includes('履歷') || lastUserMsg.includes('cv') || lastUserMsg.includes('pdf') || lastUserMsg.includes('匯出') || lastUserMsg.includes('生成')) {
    fallbackReply = '📄 **CareerDNA AI 履歷生成與匯出指引：**\n\n' +
      '1. **第一步**：點選頂部導覽列的 **AI 履歷健檢** (`career_fit_v2.html`)。\n' +
      '2. **第二步**：選擇您的目標職位，勾選已修習的專業課程與實務經歷。\n' +
      '3. **第三步**：點擊 **✨ AI 深度健檢與生成 (DEEPSEEK AI)**。\n' +
      '4. **第四步**：生成完成後，可在下方切換 **經典專業 (Classic)**、**現代雙欄 (Modern)** 或 **極簡科技 (Minimal)** 樣式。\n' +
      '5. **第五步**：點選 **匯出 PDF** 下載標準檔案，或點選 **列印 / 向量 PDF** 進行高解析度列印！\n' +
      '6. 履歷將自動同步典藏至 **個人檔案** (`profile.html`)，隨時可再次查閱。';
  } else if (lastUserMsg.includes('介紹') || lastUserMsg.includes('平台') || lastUserMsg.includes('功能') || lastUserMsg.includes('careerdna')) {
    fallbackReply = '🚀 **CareerDNA 平台核心介紹：**\n\n' +
      '- **專屬服務**：專為靜宜大學資訊學院（資工系、資管系、AI系）打造的 AI 職涯導航與履歷優化系統。\n' +
      '- **Multi-Agent 多智能體**：整合 5 大專屬 Agent（個人畫像、學術落差填補、履歷建構、ATS 審核、主調度協同）。\n' +
      '- **ATS 國際標準**：導入 Golden Triangle 三維度檢核、Micro-STAR 結構與 Google XYZ 量化公式。\n' +
      '- **雲端典藏**：全自動整合 MongoDB Atlas 與 Cloudflare R2 雲端儲存技術。';
  }

  res.json({
    status: 'ok',
    reply: fallbackReply,
    isFallback: true
  });
});

module.exports = router;

