/**
 * CareerDNA Multi-Agent System - Server & CLI Entrypoint
 * Express REST API + Static Server + CLI Test Pipeline
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { CONFIG } = require('./config');
const { connectDB } = require('./db/connection');
const apiRoutes = require('./routes/apiRoutes');
const { MasterOrchestrator } = require('./agents/masterOrchestrator');
const { mockStudentIM, mockStudentCS, mockQuickDraft } = require('./data/mockStudentPayload');
const { PROVIDENCE_PROGRAMS, PROVIDENCE_PRACTICAL_CLUSTERS, findRecommendedCourses } = require('./data/providenceCourses');
const { generateDeterministicOutput } = require('./engines/deterministicEngine');
const mongoose = require('mongoose');

const app = express();
const orchestrator = new MasterOrchestrator();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount MongoDB Atlas API Routes
app.use('/api', apiRoutes);

// Serve static frontend files from workspace root
app.use(express.static(path.resolve(__dirname, '..')));

/**
 * Health Check API
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CareerDNA Multi-Agent Resume Pipeline',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'MongoDB Atlas',
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name || 'career'
    },
    config: {
      model: CONFIG.llm.model,
      temperature: CONFIG.llm.temperature,
      deterministicConstraintMet: CONFIG.llm.temperature <= 0.3,
      hasApiKey: Boolean(CONFIG.api.geminiApiKey)
    }
  });
});

/**
 * Full Multi-Agent Resume Analysis & Generation API
 * Ingests student data, executes 5-Agent pipeline, returns structured JSON.
 */
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const payload = req.body || {};
    const forceDeterministic = req.query.deterministic === 'true';

    // Normalize student payload
    const studentPayload = {
      name: payload.name || "學生",
      department: payload.department || "IM",
      grade: payload.grade || "大三",
      hollandCode: payload.hollandCode || "RIC",
      strengths: Array.isArray(payload.strengths) ? payload.strengths : ["排難", "學習", "分析"],
      completedCourses: Array.isArray(payload.completedCourses) ? payload.completedCourses : [],
      experiences: Array.isArray(payload.experiences) ? payload.experiences : ["exp_project"],
      targetRole: payload.targetRole || "全端網頁工程師",
      rawDraft: payload.rawDraft || payload.draft || ""
    };

    const result = await orchestrator.runPipeline(studentPayload, { forceDeterministic });
    res.json(result);
  } catch (err) {
    console.error('[API /api/analyze Error]:', err);
    // Graceful recovery
    const fallback = generateDeterministicOutput(req.body || {});
    fallback.recoveredFromError = err.message;
    fallback.pipelineLatencyMs = Date.now() - startTime;
    res.json(fallback);
  }
});

/**
 * Quick Draft Generation API
 */
app.post('/api/quick-draft', async (req, res) => {
  try {
    const { careerGoals, targetRole, department, grade, completedCourses } = req.body || {};
    const studentPayload = {
      name: "快速草稿用戶",
      department: department || "IM",
      grade: grade || "大三",
      hollandCode: "RIC",
      strengths: ["學習", "排難", "適應"],
      completedCourses: completedCourses || ["網頁前端程式設計", "資料庫系統實作"],
      targetRole: targetRole || "全端網頁工程師",
      rawDraft: careerGoals || "希望成為專業軟體工程師，具備現代 Web 系統開發與資料庫整合能力。"
    };

    const result = await orchestrator.runPipeline(studentPayload);
    res.json(result);
  } catch (err) {
    console.error('[API /api/quick-draft Error]:', err);
    const fallback = generateDeterministicOutput({
      targetRole: req.body?.targetRole || "全端網頁工程師",
      rawDraft: req.body?.careerGoals || ""
    });
    res.json(fallback);
  }
});

/**
 * Providence University Course Knowledge API
 */
app.get('/api/courses', (req, res) => {
  res.json({
    programs: PROVIDENCE_PROGRAMS,
    clusters: PROVIDENCE_PRACTICAL_CLUSTERS
  });
});

/**
 * Course Recommendation API
 */
app.post('/api/courses/recommend', (req, res) => {
  const { missingSkills = [], completedCourses = [], limit = 3 } = req.body || {};
  const recommendations = findRecommendedCourses(missingSkills, completedCourses, limit);
  res.json({ recommendations });
});

/**
 * Standard Mock Data API
 */
app.get('/api/mock-data', (req, res) => {
  const type = req.query.type || 'im';
  if (type === 'cs') {
    res.json(mockStudentCS);
  } else if (type === 'quick') {
    res.json(mockQuickDraft);
  } else {
    res.json(mockStudentIM);
  }
});

// Start server function
async function startServer(port = CONFIG.server.port) {
  // Connect to MongoDB Atlas
  await connectDB();

  const server = app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 CareerDNA Multi-Agent Backend Server Active`);
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`🗄️ Database: MongoDB Atlas (career)`);
    console.log(`🛡️ Temperature Constraint: ${CONFIG.llm.temperature} (<= 0.3 locked)`);
    console.log(`🤖 Model: ${CONFIG.llm.model}`);
    console.log(`🔑 Live API Key: ${CONFIG.api.geminiApiKey ? 'Configured' : 'Offline Heuristic Fallback'}`);
    console.log(`======================================================\n`);
  });
  return server;
}

// CLI Execution Support
async function runCLI() {
  console.log(`\n======================================================`);
  console.log(`🤖 CareerDNA Multi-Agent CLI Execution`);
  console.log(`🛡️ Temperature: ${CONFIG.llm.temperature} (<= 0.3)`);
  console.log(`======================================================\n`);

  console.log(`[1/3] Ingesting Mock IM Student Payload...`);
  console.log(JSON.stringify(mockStudentIM, null, 2));

  console.log(`\n[2/3] Executing 5-Agent Orchestration Pipeline...`);
  const result = await orchestrator.runPipeline(mockStudentIM);

  console.log(`\n[3/3] Final Structured JSON Output:`);
  console.log(JSON.stringify(result, null, 2));

  console.log(`\n✅ Execution finished in ${result.pipelineLatencyMs || 0}ms.`);
}

// Auto-run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--cli') || args.includes('-c')) {
    runCLI();
  } else {
    startServer();
  }
}

module.exports = {
  app,
  startServer,
  runCLI
};
