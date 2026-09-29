const mongoose = require('mongoose');

/**
 * 1. BrandTestResult Schema (Collection: brand_test_results)
 */
const BrandTestResultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  testType: { type: String, default: 'brand' },
  hollandCode: { type: String, default: '' },
  bestDept: { type: String, default: '' },
  maxFit: { type: Number, default: 0 },
  topHolland: [{ type: mongoose.Schema.Types.Mixed }],
  topStrengths: [{ type: mongoose.Schema.Types.Mixed }],
  radarData: [{ type: Number }],
  resumeDraft: { type: String, default: '' },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  completedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'brand_test_results'
});

/**
 * 2. CareerFitResult Schema (Collection: career_fit_results)
 */
const CareerFitResultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  testType: { type: String, default: 'careerFit' },
  totalScore: { type: Number, default: 0 },
  dimensions: { type: mongoose.Schema.Types.Mixed, default: {} },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  actionPlan: [{ type: mongoose.Schema.Types.Mixed }],
  recommendations: [{ type: String }],
  skills: [{ type: String }],
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  completedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'career_fit_results'
});

/**
 * 3. LabRecommendationResult Schema (Collection: lab_recommendation_results)
 */
const LabRecommendationResultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  testType: { type: String, default: 'labRecommendation' },
  recommendedDept: { type: String, default: '' },
  recommendedDeptName: { type: String, default: '' },
  recommendedLabs: [{ type: String }],
  recommendationDescription: { type: String, default: '' },
  scores: { type: mongoose.Schema.Types.Mixed, default: {} },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  completedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'lab_recommendation_results'
});

const BrandTestResult = mongoose.models.BrandTestResult || mongoose.model('BrandTestResult', BrandTestResultSchema);
const CareerFitResult = mongoose.models.CareerFitResult || mongoose.model('CareerFitResult', CareerFitResultSchema);
const LabRecommendationResult = mongoose.models.LabRecommendationResult || mongoose.model('LabRecommendationResult', LabRecommendationResultSchema);

module.exports = {
  BrandTestResult,
  CareerFitResult,
  LabRecommendationResult
};
