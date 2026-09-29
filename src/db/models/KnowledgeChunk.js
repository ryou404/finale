/**
 * KnowledgeChunk Model
 * Stores chunked text embeddings for RAG vector search in MongoDB Atlas.
 * Supports multi-tenant isolation via scope ('public' | 'user') and userId.
 */

const mongoose = require('mongoose');

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      description: 'Unique document identifier grouping all chunks belonging to the same source document'
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: '未命名文檔 (Untitled)'
    },
    text: {
      type: String,
      required: true,
      trim: true,
      description: 'The textual content of this chunk'
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 1536;
        },
        message: 'Vector embedding must have exactly 1536 dimensions'
      },
      description: '1536-dimensional vector generated via text-embedding-3-small'
    },
    scope: {
      type: String,
      enum: ['public', 'user'],
      default: 'public',
      index: true,
      description: "'public' for system-wide guides/FAQs; 'user' for private user uploads"
    },
    userId: {
      type: String,
      default: null,
      index: true,
      description: 'Owning user ID if scope is user. Strictly enforced for multi-tenant isolation'
    },
    metadata: {
      category: { type: String, default: 'General' },
      source: { type: String, default: 'manual' }, // 'upload', 'seed', 'system', 'faq'
      originalFileName: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      chunkIndex: { type: Number, default: 0 },
      totalChunks: { type: Number, default: 1 },
      // Course-specific structured fields for instant retrieval & hybrid search
      courseCode: { type: String, default: null },
      courseName: { type: String, default: null },
      instructor: { type: String, default: null },
      department: { type: String, default: null }, // 'AI', 'CS', 'IM', etc.
      classGrade: { type: String, default: null },
      scheduleLocation: { type: String, default: null },
      courseType: { type: String, default: null }
    }
  },
  {
    timestamps: true,
    collection: 'knowledge_chunks'
  }
);

// Compound indexes for fast filtered lookups
KnowledgeChunkSchema.index({ scope: 1, userId: 1 });
KnowledgeChunkSchema.index({ docId: 1, chunkIndex: 1 });
KnowledgeChunkSchema.index({ 'metadata.courseCode': 1 });
KnowledgeChunkSchema.index({ 'metadata.department': 1 });
KnowledgeChunkSchema.index({ 'metadata.courseName': 1 });

const KnowledgeChunk = mongoose.model('KnowledgeChunk', KnowledgeChunkSchema);

module.exports = { KnowledgeChunk };
