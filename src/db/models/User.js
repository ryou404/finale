const mongoose = require('mongoose');

const BrandSnapshotSchema = new mongoose.Schema({
  date: { type: String, default: () => new Date().toISOString() },
  topHollandCode: { type: String, default: '' },
  fitScore: { type: Number, default: 0 },
  hollandCode: { type: String, default: '' },
  topStrengths: [{ type: String }],
  radarData: [{ type: Number }],
  hollandScores: { type: mongoose.Schema.Types.Mixed, default: [] },
  ucan: { type: String, default: '' }
}, { _id: false, timestamps: true });

const ResumeSnapshotSchema = new mongoose.Schema({
  selectedCourses: [{ type: String }],
  selectedExps: [{ type: String }],
  scores: {
    total: { type: Number, default: 0 },
    program: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    skill: { type: Number, default: 0 }
  },
  metrics: {
    quantifiability: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    keywordRelevance: { type: Number, default: 0 }
  },
  targetRole: { type: String, default: '' },
  rawDraft: { type: String, default: '' },
  analysis: { type: String, default: '' },
  actionItems: [{ type: String }],
  formattedResumeMarkdown: { type: String, default: '' },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { _id: false, timestamps: true });

const LabSnapshotSchema = new mongoose.Schema({
  dept: { type: String, default: '' },
  deptName: { type: String, default: '' },
  date: { type: String, default: () => new Date().toISOString() },
  scores: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false, timestamps: true });

const UserSchema = new mongoose.Schema({
  // Identifiers (Supporting both Firebase UID and MongoDB _id / Legacy Username)
  uid: { type: String, index: true },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  studentId: { type: String, default: '' },
  email: { type: String, default: '' },
  displayName: { type: String, default: '' },
  name: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  
  // Academic Background
  school: { type: String, default: '靜宜大學' },
  department: { type: String, default: 'IM' },
  dept: { type: String, default: 'IM' },
  grade: { type: String, default: '大三' },
  skills: { type: mongoose.Schema.Types.Mixed, default: [] },
  hollandCode: { type: String, default: '' },
  
  // References to Dedicated Result Collections
  brandTestResult: { type: mongoose.Schema.Types.Mixed, default: null },
  careerFitResult: { type: mongoose.Schema.Types.Mixed, default: null },
  labRecommendationResult: { type: mongoose.Schema.Types.Mixed, default: null },
  resume: { type: mongoose.Schema.Types.Mixed, default: null },
  
  // Permissions & Status
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },

  // UI & App Settings
  settings: {
    darkMode: { type: Boolean, default: false }
  },
  
  // Aggregate cache for rapid dashboard display
  summary_cache: {
    brand: {
      date: { type: String, default: '' },
      topHollandCode: { type: String, default: '' },
      fitScore: { type: Number, default: 0 },
      topStrengths: [{ type: String }]
    },
    resume: {
      updatedAt: { type: String, default: '' },
      totalScore: { type: Number, default: 0 }
    },
    lab: {
      dept: { type: String, default: '' },
      deptName: { type: String, default: '' },
      date: { type: String, default: '' }
    }
  },

  // Latest full results
  brand_results: {
    latest: { type: BrandSnapshotSchema, default: () => ({}) }
  },
  resume_data: {
    latest: { type: ResumeSnapshotSchema, default: () => ({}) }
  },

  // Historical snapshots
  history_brand: [BrandSnapshotSchema],
  history_resume: [ResumeSnapshotSchema],
  history_lab: [LabSnapshotSchema],

  // Bookmarks / Saved preferences
  favorites: [{ type: mongoose.Schema.Types.Mixed }]
}, {
  timestamps: true,
  collection: 'users'
});

// Auto-sync dept and department fields, name and displayName
UserSchema.pre('save', function() {
  if (!this.uid) this.uid = String(this._id);
  if (this.department && !this.dept) this.dept = this.department;
  if (this.dept && !this.department) this.department = this.dept;
  if (this.displayName && !this.name) this.name = this.displayName;
  if (this.name && !this.displayName) this.displayName = this.name;
  if (!this.username && this.email) this.username = this.email.split('@')[0];
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = { User };
