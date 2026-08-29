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
      cb(new Error('Chỉ chấp nhận file hình ảnh (JPG, PNG, WEBP, GIF)'));
    }
  }
});

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  const visible = name.length <= 2 ? name : name.substring(0, 2) + '***';
  return `${visible}@${domain}`;
}

/**
 * 0. Auth APIs (MongoDB Atlas Direct Authentication with Passwords & Email Verification)
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Email hoặc Tên tài khoản' });
    }
    if (!password) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Mật khẩu' });
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
        message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký!'
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
        return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác. Vui lòng thử lại!' });
      }
    } else {
      // If user had no password yet, set this as their password
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    res.json({ status: 'ok', message: 'Đăng nhập thành công', user });
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
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Họ tên / Biệt danh' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Tên tài khoản' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập địa chỉ Email hợp lệ để nhận mã xác thực' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu phải có ít nhất 4 ký tự' });
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
        ? 'Tên tài khoản này đã tồn tại trong hệ thống. Vui lòng chọn tên khác!'
        : 'Địa chỉ Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng chức năng Quên mật khẩu!';
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

    // Send verification email via Gmail SMTP
    await sendOtpEmail(targetEmail, otpCode, 'register', name.trim());

    res.json({
      status: 'ok',
      message: `Mã xác thực đã được gửi tới email ${maskEmail(targetEmail)}. Vui lòng kiểm tra hộp thư!`,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail)
    });
  } catch (err) {
    console.error('[API /auth/register-request error]:', err);
    res.status(500).json({ status: 'error', message: 'Không thể gửi email xác thực: ' + err.message });
  }
});

/**
 * 0.2 Register Step 2: Verify OTP & Create User in MongoDB Atlas
 */
router.post('/auth/register-verify', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Email và Mã xác thực OTP' });
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
        message: 'Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng thử lại!'
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
      message: 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.',
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
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Tên tài khoản hoặc Email đã đăng ký' });
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
        message: 'Không tìm thấy tài khoản tương ứng trong hệ thống. Vui lòng kiểm tra lại!'
      });
    }

    if (!user.email || !user.email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'Tài khoản này chưa liên kết địa chỉ Email. Vui lòng liên hệ ban quản trị để được hỗ trợ!'
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

    // Send reset email via Gmail SMTP
    await sendOtpEmail(user.email.toLowerCase(), otpCode, 'forgot_password', user.name || user.username);

    res.json({
      status: 'ok',
      message: `Mã đặt lại mật khẩu đã được gửi tới ${maskEmail(user.email)}. Vui lòng kiểm tra hộp thư!`,
      email: user.email.toLowerCase(),
      maskedEmail: maskEmail(user.email)
    });
  } catch (err) {
    console.error('[API /auth/forgot-request error]:', err);
    res.status(500).json({ status: 'error', message: 'Không thể gửi email đặt lại mật khẩu: ' + err.message });
  }
});

/**
 * 0.4 Forgot Password Step 2: Verify OTP & Update Password
 */
router.post('/auth/forgot-verify-reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ Email, Mã OTP và Mật khẩu mới' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
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
        message: 'Mã xác thực đặt lại mật khẩu không chính xác hoặc đã hết hạn!'
      });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng tương ứng' });
    }

    // Update password with new bcrypt hash
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Remove used OTP
    await OtpToken.deleteMany({ email: targetEmail, type: 'forgot_password' });

    res.json({
      status: 'ok',
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
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
      return res.status(400).json({ status: 'error', message: 'Địa chỉ Email không hợp lệ' });
    }

    const targetEmail = email.trim().toLowerCase();
    const otpType = type === 'forgot_password' ? 'forgot_password' : 'register';

    const existingOtp = await OtpToken.findOne({ email: targetEmail, type: otpType });
    if (!existingOtp) {
      return res.status(404).json({ status: 'error', message: 'Phiên xác thực đã hết hạn. Vui lòng thực hiện lại từ đầu!' });
    }

    const newCode = generateOTP();
    existingOtp.code = newCode;
    existingOtp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingOtp.save();

    await sendOtpEmail(targetEmail, newCode, otpType);

    res.json({
      status: 'ok',
      message: `Mã OTP mới đã được gửi lại tới email ${maskEmail(targetEmail)}`
    });
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
      { new: true, upsert: true, setDefaultsOnInsert: true }
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
      { $or: [{ uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      { $set: updateFields },
      { new: true, upsert: true }
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
      { new: true, upsert: true }
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
      selectedCourses: Array.isArray(resumeData.selectedCourses) ? resumeData.selectedCourses : [],
      selectedExps: Array.isArray(resumeData.selectedExps) ? resumeData.selectedExps : [],
      scores: resumeData.scores || { total: 0, program: 0, exp: 0, skill: 0 },
      metrics: resumeData.metrics || { quantifiability: 0, completeness: 0, keywordRelevance: 0 },
      targetRole: resumeData.targetRole || '',
      rawDraft: resumeData.rawDraft || '',
      analysis: resumeData.analysis || '',
      actionItems: Array.isArray(resumeData.actionItems) ? resumeData.actionItems : [],
      formattedResumeMarkdown: resumeData.formattedResumeMarkdown || resumeData.resumeMarkdown || '',
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

    // 2. Update user document
    const user = await User.findOneAndUpdate(
      { $or: [{ uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      {
        $set: {
          careerFitResult: careerFitDoc._id,
          'resume_data.latest': snapshot,
          'summary_cache.resume': {
            updatedAt: updatedAtStr,
            totalScore: snapshot.scores.total || 0
          }
        },
        $push: { history_resume: snapshot }
      },
      { new: true, upsert: true }
    );

    res.json({ status: 'ok', resume: snapshot, careerFitDocId: careerFitDoc._id, user });
  } catch (err) {
    console.error('[API /users/:uid/resume error]:', err);
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
      { new: true, upsert: true }
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
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn một file hình ảnh avatar!' });
    }

    const { key, url } = await uploadAvatarToR2(req.file.buffer, req.file.mimetype, uid, req.file.originalname);
    
    // Update User in MongoDB Atlas
    let user = await User.findOneAndUpdate(
      { $or: [{ uid }, { username: uid }, { email: uid }] },
      { $set: { photoURL: url, updatedAt: new Date() } },
      { new: true }
    );

    if (!user && mongoose.Types.ObjectId.isValid(uid)) {
      user = await User.findByIdAndUpdate(uid, { $set: { photoURL: url, updatedAt: new Date() } }, { new: true });
    }

    return res.json({
      status: 'ok',
      message: 'Tải lên avatar thành công lên Cloudflare R2!',
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
 * Cloudflare R2 Status Check Endpoint
 */
router.get('/r2/status', async (req, res) => {
  const result = await checkR2Status();
  return res.json(result);
});

module.exports = router;
