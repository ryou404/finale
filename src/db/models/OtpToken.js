const mongoose = require('mongoose');

const OtpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['register', 'forgot_password'],
    required: true
  },
  tempData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from creation
    index: { expires: 0 } // TTL index
  }
}, {
  timestamps: true,
  collection: 'otp_tokens'
});

const OtpToken = mongoose.models.OtpToken || mongoose.model('OtpToken', OtpTokenSchema);

module.exports = { OtpToken };
