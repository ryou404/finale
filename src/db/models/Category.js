const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  nameEn: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '📚'
  },
  order: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

CategorySchema.pre('save', function () {
  if (!this.categoryId) {
    this.categoryId = 'cat_' + (this.nameEn ? this.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_') : Date.now().toString(36));
  }
});

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
