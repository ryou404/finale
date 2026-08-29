const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Models
const { User } = require('../db/models/User');
const { Resource } = require('../db/models/Resource');
const { Professor } = require('../db/models/Professor');
const { AuditLog } = require('../db/models/AuditLog');
const { UploadedFile } = require('../db/models/UploadedFile');
const { BrandTestResult, CareerFitResult, LabRecommendationResult } = require('../db/models/LegacyResults');

// Middleware & Services
const { requireAdmin } = require('../middleware/adminMiddleware');
const { uploadFileToR2, deleteFileFromR2, listFilesFromR2, checkR2Status, R2_PUBLIC_URL } = require('../services/r2Service');
const { runAllSeeds, seedResources } = require('../db/seed');

// Multer for general file uploads (up to 50MB for documents, PDFs, etc.)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Protect all admin routes with requireAdmin middleware
router.use(requireAdmin);

/**
 * ===================================================================
 * 1. DASHBOARD & SYSTEM METRICS
 * ===================================================================
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      adminCount,
      activeUsers,
      totalResources,
      totalProfessors,
      totalAuditLogs,
      totalUploadedFiles,
      brandCount,
      careerFitCount,
      labCount,
      recentUsers,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: { $ne: false } }),
      Resource.countDocuments({ isActive: { $ne: false } }),
      Professor.countDocuments(),
      AuditLog.countDocuments(),
      UploadedFile.countDocuments(),
      BrandTestResult.countDocuments(),
      CareerFitResult.countDocuments(),
      LabRecommendationResult.countDocuments(),
      User.find({}, 'uid username name email department grade role isActive createdAt updatedAt photoURL')
        .sort({ createdAt: -1 })
        .limit(5),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Department Distribution
    const deptStats = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Grade Distribution
    const gradeStats = await User.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } }
    ]);

    // Resource Category Distribution
    const categoryStats = await Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // ATS Average Score
    const atsAvg = await AuditLog.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
    ]);

    res.json({
      status: 'ok',
      metrics: {
        totalUsers,
        adminCount,
        activeUsers,
        totalResources,
        totalProfessors,
        totalAuditLogs,
        totalUploadedFiles,
        totalTests: brandCount + careerFitCount + labCount,
        avgAtsScore: atsAvg.length > 0 ? Math.round(atsAvg[0].avgScore) : 0
      },
      distributions: {
        departments: deptStats.map(d => ({ dept: d._id || 'Unknown', count: d.count })),
        grades: gradeStats.map(g => ({ grade: g._id || 'Unknown', count: g.count })),
        categories: categoryStats.map(c => ({ category: c._id || 'General', count: c.count }))
      },
      recentUsers,
      recentLogs
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 2. USER MANAGEMENT (CRUD)
 * ===================================================================
 */

// List Users with pagination, search, filter
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const { search, dept, grade, role, status } = req.query;

    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { displayName: regex },
        { username: regex },
        { email: regex },
        { uid: regex }
      ];
    }

    if (dept && dept !== 'all') {
      query.department = dept;
    }

    if (grade && grade !== 'all') {
      query.grade = grade;
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = { $ne: false };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    // Enhance users with test indicators
    const formattedUsers = users.map(u => ({
      ...u,
      hasBrand: Boolean(u.brand_results?.latest?.topHollandCode || u.brandTestResult),
      hasResume: Boolean(u.resume_data?.latest?.scores?.total || u.careerFitResult),
      hasLab: Boolean(u.summary_cache?.lab?.dept || u.labRecommendationResult),
      passwordMasked: Boolean(u.password)
    }));

    res.json({
      status: 'ok',
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      users: formattedUsers
    });
  } catch (err) {
    console.error('[Admin Get Users Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get Single User Dossier (Deep Detail)
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({
      $or: [
        { uid },
        { username: uid },
        { email: uid.toLowerCase() },
        { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }
      ]
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Fetch related legacy results if exists
    const [brandDoc, careerDoc, labDoc, userLogs] = await Promise.all([
      BrandTestResult.find({ userId: user.uid }).sort({ createdAt: -1 }).limit(5),
      CareerFitResult.find({ userId: user.uid }).sort({ createdAt: -1 }).limit(5),
      LabRecommendationResult.find({ userId: user.uid }).sort({ createdAt: -1 }).limit(5),
      AuditLog.find({ userId: user.uid }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({
      status: 'ok',
      user,
      history: {
        brand: brandDoc,
        careerFit: careerDoc,
        lab: labDoc,
        auditLogs: userLogs
      }
    });
  } catch (err) {
    console.error('[Admin Get User Detail Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create User Manually
router.post('/users', async (req, res) => {
  try {
    const { username, name, email, password, department, grade, role, isActive, school } = req.body || {};

    if (!username || !username.trim()) {
      return res.status(400).json({ status: 'error', message: 'Username is required' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    const existing = await User.findOne({
      $or: [
        { username: trimmedUsername },
        ...(trimmedEmail ? [{ email: trimmedEmail }] : [])
      ]
    });

    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Username or Email already in use' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : '';
    const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const newUser = await User.create({
      uid,
      username: trimmedUsername,
      name: name || trimmedUsername,
      displayName: name || trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      department: department || 'IM',
      dept: department || 'IM',
      grade: grade || '大三',
      school: school || '靜宜大學',
      role: role === 'admin' ? 'admin' : 'user',
      isActive: isActive !== false
    });

    res.json({ status: 'ok', message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error('[Admin Create User Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update User (Edit Profile / Role / Status)
router.put('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, displayName, email, department, dept, grade, school, role, isActive, skills } = req.body || {};

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (department !== undefined) updateFields.department = department;
    if (dept !== undefined) updateFields.dept = dept;
    if (grade !== undefined) updateFields.grade = grade;
    if (school !== undefined) updateFields.school = school;
    if (role !== undefined && ['user', 'admin'].includes(role)) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (skills !== undefined && Array.isArray(skills)) updateFields.skills = skills;

    const user = await User.findOneAndUpdate(
      { $or: [{ uid }, { username: uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'ok', message: 'User updated successfully', user });
  } catch (err) {
    console.error('[Admin Update User Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Reset Password directly
router.put('/users/:uid/reset-password', async (req, res) => {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ status: 'error', message: 'New password must have at least 4 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { $or: [{ uid }, { username: uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }] },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'ok', message: `Password reset successfully for ${user.username || user.name}` });
  } catch (err) {
    console.error('[Admin Reset Password Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete User
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { permanent } = req.query;

    const user = await User.findOne({
      $or: [{ uid }, { username: uid }, { _id: mongoose.Types.ObjectId.isValid(uid) ? uid : null }]
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Prevent deleting own root admin
    if (req.adminUser && req.adminUser.uid === user.uid) {
      return res.status(400).json({ status: 'error', message: 'You cannot delete your own logged-in admin account!' });
    }

    if (permanent === 'true') {
      await User.deleteOne({ _id: user._id });
      return res.json({ status: 'ok', message: `User ${user.username || user.name} permanently deleted.` });
    } else {
      user.isActive = false;
      user.updatedAt = new Date();
      await user.save();
      return res.json({ status: 'ok', message: `User ${user.username || user.name} disabled (soft deleted).` });
    }
  } catch (err) {
    console.error('[Admin Delete User Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 3. LEARNING RESOURCES & CATEGORIES MANAGEMENT (CRUD + R2 MULTI-FILE UPLOAD)
 * ===================================================================
 */

// List Categories
router.get('/categories', async (req, res) => {
  try {
    const Category = require('../db/models/Category');
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    
    // Count resources in each category
    const counts = await Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    const formatted = categories.map(c => ({
      id: c.categoryId || String(c._id),
      _id: String(c._id),
      categoryId: c.categoryId,
      name: c.name,
      nameEn: c.nameEn,
      icon: c.icon || '📚',
      order: c.order || 0,
      description: c.description || '',
      resourceCount: countMap[c.name] || 0
    }));

    res.json({ status: 'ok', count: formatted.length, categories: formatted });
  } catch (err) {
    console.error('[Admin Get Categories Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create Category
router.post('/categories', async (req, res) => {
  try {
    const Category = require('../db/models/Category');
    const { name, nameEn, icon, order, description } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({ name: trimmedName });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Category with this name already exists' });
    }

    const categoryId = 'cat_' + (nameEn ? nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_') : Date.now().toString(36));

    const newCategory = await Category.create({
      categoryId,
      name: trimmedName,
      nameEn: nameEn ? nameEn.trim() : '',
      icon: icon || '📚',
      order: parseInt(order) || 0,
      description: description || ''
    });

    res.json({ status: 'ok', message: 'Category created successfully', category: newCategory });
  } catch (err) {
    console.error('[Admin Create Category Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update Category
router.put('/categories/:id', async (req, res) => {
  try {
    const Category = require('../db/models/Category');
    const { id } = req.params;
    const { name, nameEn, icon, order, description } = req.body || {};

    const category = await Category.findOne({
      $or: [{ categoryId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    const oldName = category.name;

    if (name && name.trim() && name.trim() !== oldName) {
      const newName = name.trim();
      const existing = await Category.findOne({ name: newName });
      if (existing) {
        return res.status(409).json({ status: 'error', message: 'Another category with this name already exists' });
      }
      category.name = newName;
      // Auto-update all resources with the old category name
      await Resource.updateMany({ category: oldName }, { $set: { category: newName } });
    }

    if (nameEn !== undefined) category.nameEn = nameEn.trim();
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = parseInt(order) || 0;
    if (description !== undefined) category.description = description;

    await category.save();

    res.json({ status: 'ok', message: 'Category updated successfully', category });
  } catch (err) {
    console.error('[Admin Update Category Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  try {
    const Category = require('../db/models/Category');
    const { id } = req.params;

    const category = await Category.findOne({
      $or: [{ categoryId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    // Reassign resources to '其他'
    await Resource.updateMany({ category: category.name }, { $set: { category: '其他' } });
    await Category.deleteOne({ _id: category._id });

    res.json({ status: 'ok', message: `Category '${category.name}' deleted successfully` });
  } catch (err) {
    console.error('[Admin Delete Category Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// List Resources
router.get('/resources', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { search, category, dept, grade } = req.query;

    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { tags: regex },
        { resourceId: regex }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (dept && dept !== 'all') {
      query.departments = dept;
    }

    if (grade && grade !== 'all') {
      const gradeNum = parseInt(grade);
      if (!isNaN(gradeNum)) {
        query.grades = gradeNum;
      }
    }

    const [total, resources] = await Promise.all([
      Resource.countDocuments(query),
      Resource.find(query)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      status: 'ok',
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      resources
    });
  } catch (err) {
    console.error('[Admin Get Resources Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

function fixFileNameEncoding(originalName) {
  if (!originalName) return 'attachment';
  try {
    const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
    if (decoded && !decoded.includes('')) {
      return decoded;
    }
  } catch (e) {}
  return originalName;
}

// Create Resource (Supports Multi-File Upload to Cloudflare R2 + Multi-Links)
router.post('/resources', upload.array('files', 10), async (req, res) => {
  try {
    let payload = req.body || {};
    if (typeof payload.departments === 'string') {
      try { payload.departments = JSON.parse(payload.departments); } catch (e) { payload.departments = payload.departments.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof payload.grades === 'string') {
      try { payload.grades = JSON.parse(payload.grades); } catch (e) { payload.grades = payload.grades.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)); }
    }
    if (typeof payload.tags === 'string') {
      try { payload.tags = JSON.parse(payload.tags); } catch (e) { payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof payload.links === 'string') {
      try { payload.links = JSON.parse(payload.links); } catch (e) { payload.links = []; }
    }
    if (typeof payload.featured === 'string') {
      payload.featured = payload.featured === 'true';
    }

    // Process all uploaded files to Cloudflare R2
    const uploadedFilesList = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cleanName = fixFileNameEncoding(file.originalname);
        const r2Res = await uploadFileToR2(
          file.buffer,
          file.mimetype,
          'resources',
          cleanName,
          req.adminUser?.uid || 'admin'
        );

        uploadedFilesList.push({
          name: cleanName,
          url: r2Res.url,
          key: r2Res.key,
          size: r2Res.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });

        // Index in UploadedFile collection
        await UploadedFile.create({
          originalName: cleanName,
          key: r2Res.key,
          url: r2Res.url,
          size: r2Res.size,
          mimeType: file.mimetype,
          folder: 'resources',
          uploadedBy: req.adminUser?.name || req.adminUser?.username || 'admin',
          description: payload.title || ''
        });
      }
    }

    // Prepare links list
    let linksList = Array.isArray(payload.links) ? payload.links : [];
    if (payload.url && payload.url.trim() && !linksList.some(l => l.url === payload.url.trim())) {
      linksList.push({ title: '外部連結 (External URL)', url: payload.url.trim(), type: 'link' });
    }

    const resourceId = payload.resourceId || 'res_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const newResource = await Resource.create({
      resourceId,
      title: payload.title || 'Untitled Resource',
      category: payload.category || '學科資源',
      type: payload.type || (uploadedFilesList.length > 0 ? '檔案' : '筆記'),
      departments: Array.isArray(payload.departments) && payload.departments.length > 0 ? payload.departments : ['資工系', '資管系', '人工智慧系'],
      grades: Array.isArray(payload.grades) && payload.grades.length > 0 ? payload.grades : [1, 2, 3, 4],
      description: payload.description || '',
      content: payload.content || '',
      files: uploadedFilesList,
      links: linksList,
      url: uploadedFilesList.length > 0 ? uploadedFilesList[0].url : (linksList.length > 0 ? linksList[0].url : (payload.url || '')),
      fileKey: uploadedFilesList.length > 0 ? uploadedFilesList[0].key : '',
      fileName: uploadedFilesList.length > 0 ? uploadedFilesList[0].name : '',
      fileSize: uploadedFilesList.length > 0 ? uploadedFilesList[0].size : 0,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      featured: Boolean(payload.featured),
      icon: payload.icon || '📚',
      updatedAtFormatted: new Date().toISOString().substring(0, 7),
      createdBy: req.adminUser?.username || 'admin',
      isActive: true
    });

    res.json({ status: 'ok', message: 'Resource created successfully', resource: newResource });
  } catch (err) {
    console.error('[Admin Create Resource Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update Resource (Multi-Files & Multi-Links)
router.put('/resources/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    let payload = req.body || {};

    if (typeof payload.departments === 'string') {
      try { payload.departments = JSON.parse(payload.departments); } catch (e) { payload.departments = payload.departments.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof payload.grades === 'string') {
      try { payload.grades = JSON.parse(payload.grades); } catch (e) { payload.grades = payload.grades.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)); }
    }
    if (typeof payload.tags === 'string') {
      try { payload.tags = JSON.parse(payload.tags); } catch (e) { payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof payload.links === 'string') {
      try { payload.links = JSON.parse(payload.links); } catch (e) { payload.links = []; }
    }
    if (typeof payload.existingFiles === 'string') {
      try { payload.existingFiles = JSON.parse(payload.existingFiles); } catch (e) { payload.existingFiles = null; }
    }
    if (typeof payload.featured === 'string') {
      payload.featured = payload.featured === 'true';
    }
    if (typeof payload.isActive === 'string') {
      payload.isActive = payload.isActive === 'true';
    }

    const resource = await Resource.findOne({
      $or: [{ resourceId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!resource) {
      return res.status(404).json({ status: 'error', message: 'Resource not found' });
    }

    // Retain or purge existing files
    let currentFiles = resource.files || [];
    if (payload.existingFiles && Array.isArray(payload.existingFiles)) {
      const keepKeys = new Set(payload.existingFiles.map(f => f.key));
      // Delete removed files from R2
      for (const f of currentFiles) {
        if (!keepKeys.has(f.key)) {
          try {
            await deleteFileFromR2(f.key);
            await UploadedFile.deleteOne({ key: f.key });
          } catch (e) {}
        }
      }
      currentFiles = payload.existingFiles;
    }

    // Upload newly attached files to Cloudflare R2
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cleanName = fixFileNameEncoding(file.originalname);
        const r2Res = await uploadFileToR2(
          file.buffer,
          file.mimetype,
          'resources',
          cleanName,
          req.adminUser?.uid || 'admin'
        );

        currentFiles.push({
          name: cleanName,
          url: r2Res.url,
          key: r2Res.key,
          size: r2Res.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });

        await UploadedFile.create({
          originalName: cleanName,
          key: r2Res.key,
          url: r2Res.url,
          size: r2Res.size,
          mimeType: file.mimetype,
          folder: 'resources',
          uploadedBy: req.adminUser?.name || req.adminUser?.username || 'admin',
          description: payload.title || resource.title
        });
      }
    }

    resource.files = currentFiles;

    // Update Links
    if (payload.links !== undefined && Array.isArray(payload.links)) {
      resource.links = payload.links;
    } else if (payload.url !== undefined && payload.url.trim()) {
      if (!resource.links || resource.links.length === 0) {
        resource.links = [{ title: '外部連結', url: payload.url.trim(), type: 'link' }];
      }
    }

    if (payload.title !== undefined) resource.title = payload.title;
    if (payload.category !== undefined) resource.category = payload.category;
    if (payload.type !== undefined) resource.type = payload.type;
    if (payload.departments !== undefined) resource.departments = payload.departments;
    if (payload.grades !== undefined) resource.grades = payload.grades;
    if (payload.description !== undefined) resource.description = payload.description;
    if (payload.content !== undefined) resource.content = payload.content;
    if (payload.tags !== undefined) resource.tags = payload.tags;
    if (payload.featured !== undefined) resource.featured = payload.featured;
    if (payload.icon !== undefined) resource.icon = payload.icon;
    if (payload.isActive !== undefined) resource.isActive = payload.isActive;
    
    // Auto-sync legacy fields
    if (resource.files && resource.files.length > 0) {
      resource.fileKey = resource.files[0].key;
      resource.fileName = resource.files[0].name;
      resource.fileSize = resource.files[0].size;
      resource.url = resource.files[0].url;
    } else if (resource.links && resource.links.length > 0) {
      resource.url = resource.links[0].url;
      resource.fileKey = '';
    }

    resource.updatedAtFormatted = new Date().toISOString().substring(0, 7);

    await resource.save();

    res.json({ status: 'ok', message: 'Resource updated successfully', resource });
  } catch (err) {
    console.error('[Admin Update Resource Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete Resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findOne({
      $or: [{ resourceId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!resource) {
      return res.status(404).json({ status: 'error', message: 'Resource not found' });
    }

    // Delete all attached files from R2
    if (resource.files && resource.files.length > 0) {
      for (const f of resource.files) {
        if (f.key) {
          try {
            await deleteFileFromR2(f.key);
            await UploadedFile.deleteOne({ key: f.key });
          } catch (e) {}
        }
      }
    } else if (resource.fileKey) {
      try {
        await deleteFileFromR2(resource.fileKey);
        await UploadedFile.deleteOne({ key: resource.fileKey });
      } catch (e) {}
    }

    await Resource.deleteOne({ _id: resource._id });

    res.json({ status: 'ok', message: 'Resource and all attached R2 files deleted successfully' });
  } catch (err) {
    console.error('[Admin Delete Resource Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Reseed resources endpoint
router.post('/resources/seed', async (req, res) => {
  try {
    await seedResources(true);
    const count = await Resource.countDocuments();
    res.json({ status: 'ok', message: `Reseeded resources successfully. Total count: ${count}` });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 4. CLOUDFLARE R2 FILE MANAGER & UPLOADER
 * ===================================================================
 */

// List All Stored Files
router.get('/files', async (req, res) => {
  try {
    const { folder, search } = req.query;
    const query = {};
    if (folder && folder !== 'all') query.folder = folder;
    if (search && search.trim()) {
      query.originalName = new RegExp(search.trim(), 'i');
    }

    const files = await UploadedFile.find(query).sort({ createdAt: -1 });

    // Also get real-time bucket summary
    const bucketStatus = await checkR2Status();

    res.json({
      status: 'ok',
      count: files.length,
      bucketStatus,
      files
    });
  } catch (err) {
    console.error('[Admin Get Files Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Upload Any File (PDF, DOCX, ZIP, Image, PPTX, etc.) directly to R2
router.post('/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please select a file to upload' });
    }

    const folder = req.body?.folder || 'documents';
    const description = req.body?.description || '';

    const r2Res = await uploadFileToR2(
      req.file.buffer,
      req.file.mimetype,
      folder,
      req.file.originalname,
      req.adminUser?.uid || 'admin'
    );

    const fileDoc = await UploadedFile.create({
      originalName: req.file.originalname,
      key: r2Res.key,
      url: r2Res.url,
      size: r2Res.size,
      mimeType: req.file.mimetype,
      folder,
      uploadedBy: req.adminUser?.name || req.adminUser?.username || 'admin',
      description
    });

    res.json({
      status: 'ok',
      message: 'File uploaded successfully to Cloudflare R2!',
      file: fileDoc
    });
  } catch (err) {
    console.error('[Admin File Upload Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete File from R2
router.delete('/files', async (req, res) => {
  try {
    const { key, id } = req.body || req.query;
    if (!key && !id) {
      return res.status(400).json({ status: 'error', message: 'File key or id is required' });
    }

    let targetKey = key;
    if (!targetKey && id) {
      const fileDoc = await UploadedFile.findById(id);
      if (fileDoc) targetKey = fileDoc.key;
    }

    if (targetKey) {
      await deleteFileFromR2(targetKey);
      await UploadedFile.deleteMany({ key: targetKey });
    }

    res.json({ status: 'ok', message: `File [${targetKey}] deleted from Cloudflare R2` });
  } catch (err) {
    console.error('[Admin File Delete Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 5. PROFESSOR & LAB MANAGEMENT
 * ===================================================================
 */

// List Professors
router.get('/professors', async (req, res) => {
  try {
    const { dept } = req.query;
    const filter = dept && dept !== 'all' ? { department: dept.toUpperCase() } : {};
    const professors = await Professor.find(filter).sort({ department: 1, name: 1 });
    res.json({ status: 'ok', count: professors.length, professors });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create Professor
router.post('/professors', upload.single('avatarFile'), async (req, res) => {
  try {
    const { name, title, department, labName, researchFields, email, office, bio, acceptingStudents, avatar } = req.body || {};

    if (!name || !department) {
      return res.status(400).json({ status: 'error', message: 'Name and Department are required' });
    }

    let avatarUrl = avatar || '';
    if (req.file) {
      const r2Res = await uploadFileToR2(req.file.buffer, req.file.mimetype, 'professors', req.file.originalname, 'admin');
      avatarUrl = r2Res.url;
    }

    let fields = [];
    if (Array.isArray(researchFields)) fields = researchFields;
    else if (typeof researchFields === 'string') {
      try { fields = JSON.parse(researchFields); } catch (e) { fields = researchFields.split(',').map(s => s.trim()).filter(Boolean); }
    }

    const professor = await Professor.create({
      name: name.trim(),
      title: title || '副教授',
      department: department.toUpperCase(),
      labName: labName || '',
      researchFields: fields,
      email: email || '',
      office: office || '',
      avatar: avatarUrl,
      bio: bio || '',
      acceptingStudents: acceptingStudents !== false && acceptingStudents !== 'false'
    });

    res.json({ status: 'ok', message: 'Professor created successfully', professor });
  } catch (err) {
    console.error('[Admin Create Professor Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update Professor
router.put('/professors/:id', upload.single('avatarFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, department, labName, researchFields, email, office, bio, acceptingStudents, avatar } = req.body || {};

    const professor = await Professor.findById(id);
    if (!professor) {
      return res.status(404).json({ status: 'error', message: 'Professor not found' });
    }

    if (req.file) {
      const r2Res = await uploadFileToR2(req.file.buffer, req.file.mimetype, 'professors', req.file.originalname, 'admin');
      professor.avatar = r2Res.url;
    } else if (avatar !== undefined) {
      professor.avatar = avatar;
    }

    if (name !== undefined) professor.name = name;
    if (title !== undefined) professor.title = title;
    if (department !== undefined) professor.department = department.toUpperCase();
    if (labName !== undefined) professor.labName = labName;
    if (email !== undefined) professor.email = email;
    if (office !== undefined) professor.office = office;
    if (bio !== undefined) professor.bio = bio;
    if (acceptingStudents !== undefined) professor.acceptingStudents = acceptingStudents === true || acceptingStudents === 'true';

    if (researchFields !== undefined) {
      if (Array.isArray(researchFields)) professor.researchFields = researchFields;
      else if (typeof researchFields === 'string') {
        try { professor.researchFields = JSON.parse(researchFields); } catch (e) { professor.researchFields = researchFields.split(',').map(s => s.trim()).filter(Boolean); }
      }
    }

    await professor.save();
    res.json({ status: 'ok', message: 'Professor updated successfully', professor });
  } catch (err) {
    console.error('[Admin Update Professor Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete Professor
router.delete('/professors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Professor.findByIdAndDelete(id);
    res.json({ status: 'ok', message: 'Professor deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 6. ATS AUDIT LOGS INSPECTION
 * ===================================================================
 */

// List Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, minScore, maxScore } = req.query;

    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userId: regex },
        { targetRole: regex },
        { auditSummary: regex }
      ];
    }

    if (minScore !== undefined && !isNaN(parseInt(minScore))) {
      query.overallScore = { ...query.overallScore, $gte: parseInt(minScore) };
    }

    if (maxScore !== undefined && !isNaN(parseInt(maxScore))) {
      query.overallScore = { ...query.overallScore, $lte: parseInt(maxScore) };
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      status: 'ok',
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      logs
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete Single Audit Log
router.delete('/audit-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AuditLog.findByIdAndDelete(id);
    res.json({ status: 'ok', message: 'Audit log deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ===================================================================
 * 7. SYSTEM STATUS & TOOLS
 * ===================================================================
 */

router.get('/system/status', async (req, res) => {
  try {
    const r2Status = await checkR2Status();
    const memory = process.memoryUsage();

    res.json({
      status: 'ok',
      database: {
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host || 'none',
        name: mongoose.connection.name || 'career'
      },
      cloudStorage: r2Status,
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: {
          rss: Math.round(memory.rss / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Trigger Reseed
router.post('/system/reseed', async (req, res) => {
  try {
    const result = await runAllSeeds({ forceResources: true });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
