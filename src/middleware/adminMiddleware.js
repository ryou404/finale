const mongoose = require('mongoose');
const { User } = require('../db/models/User');

/**
 * Admin Authentication Middleware
 * Validates that the caller is an active administrator.
 */
async function requireAdmin(req, res, next) {
  try {
    const adminIdentifier = 
      req.headers['x-admin-uid'] || 
      req.headers['x-admin-id'] || 
      req.headers['admin-uid'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) ||
      req.query.admin_uid ||
      req.body?.admin_uid;

    if (!adminIdentifier) {
      return res.status(401).json({
        status: 'error',
        message: '未授權的訪問：缺少管理員憑證 (Unauthorized: Missing Admin Credentials)'
      });
    }

    const trimmed = String(adminIdentifier).trim();

    // Find admin user in MongoDB
    let user = await User.findOne({
      $or: [
        { uid: trimmed },
        { username: trimmed },
        { email: trimmed.toLowerCase() },
        { _id: mongoose.Types.ObjectId.isValid(trimmed) ? trimmed : null }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '無效的管理員識別碼 (Invalid Admin Identifier)'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        status: 'error',
        message: '此管理員帳戶已被停用 (Admin Account Disabled)'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: '權限不足：需要系統管理員權限 (Forbidden: Admin Privileges Required)'
      });
    }

    // Attach verified admin user to request object
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('[Admin Middleware Error]:', err);
    res.status(500).json({ status: 'error', message: '管理員授權驗證異常: ' + err.message });
  }
}

module.exports = {
  requireAdmin
};
