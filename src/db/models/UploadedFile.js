const mongoose = require('mongoose');

const UploadedFileSchema = new mongoose.Schema({
  fileId: { type: String, unique: true, sparse: true, index: true },
  originalName: { type: String, required: true },
  key: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/octet-stream' },
  folder: { type: String, default: 'documents', index: true }, // 'documents', 'avatars', 'resources', 'resumes'
  uploadedBy: { type: String, default: 'admin' },
  description: { type: String, default: '' },
  tags: [{ type: String }]
}, {
  timestamps: true,
  collection: 'uploaded_files'
});

UploadedFileSchema.pre('save', function() {
  if (!this.fileId) {
    this.fileId = 'file_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }
});

const UploadedFile = mongoose.models.UploadedFile || mongoose.model('UploadedFile', UploadedFileSchema);

module.exports = { UploadedFile };
