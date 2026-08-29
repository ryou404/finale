const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  resourceId: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true,
    trim: true,
    index: true 
  },
  type: { type: String, default: '筆記', trim: true }, // 筆記, 教學, 速查表, 介紹, 指南, 線上課程, 檔案, PDF
  departments: [{ type: String }], // '資工系', '資管系', '人工智慧系'
  grades: [{ type: Number }], // 1, 2, 3, 4
  description: { type: String, default: '' },
  content: { type: String, default: '' }, // Markdown notes / detailed guide
  
  // Multi-Files support (Cloudflare R2)
  files: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    key: { type: String, required: true },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Multi-Links support (External Links / GitHub / Docs / Videos)
  links: [{
    title: { type: String, required: true, default: '參考連結' },
    url: { type: String, required: true },
    type: { type: String, default: 'link' }
  }],

  // Legacy single file / url compatibility
  url: { type: String, default: '' },
  fileKey: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  fileMimeType: { type: String, default: '' },

  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  icon: { type: String, default: '📚' },
  updatedAtFormatted: { type: String, default: () => new Date().toISOString().substring(0, 7) },
  createdBy: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'resources'
});

ResourceSchema.pre('save', function() {
  if (!this.resourceId) {
    this.resourceId = 'res_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }
  // Auto-sync legacy single file/url if empty
  if (this.files && this.files.length > 0 && !this.fileKey) {
    this.fileKey = this.files[0].key;
    this.fileName = this.files[0].name;
    this.fileSize = this.files[0].size;
    if (!this.url) this.url = this.files[0].url;
  }
  if (this.links && this.links.length > 0 && !this.url) {
    this.url = this.links[0].url;
  }
});

const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

module.exports = { Resource };
