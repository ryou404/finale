const mongoose = require('mongoose');

const ProfessorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, default: '副教授' },
  department: { type: String, required: true }, // CS, IM, AI
  labName: { type: String, default: '' },
  researchFields: [{ type: String }],
  email: { type: String, default: '' },
  office: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  acceptingStudents: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'professors'
});

const Professor = mongoose.models.Professor || mongoose.model('Professor', ProfessorSchema);

module.exports = { Professor };
