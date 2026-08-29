const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  targetRole: { type: String, default: '' },
  overallScore: { type: Number, required: true },
  grade: { type: String, default: 'A' },
  metrics: {
    quantifiability: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    keywordRelevance: { type: Number, default: 0 }
  },
  auditSummary: { type: String, default: '' },
  matchedTechStack: [{ type: String }],
  missingTechStack: [{ type: String }],
  rawDraftLength: { type: Number, default: 0 },
  pipelineLatencyMs: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = { AuditLog };
