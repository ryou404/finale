const express = require('express');
const { getRecommendedCourses } = require('../services/courseCatalogService');

const router = express.Router();

/**
 * GET /api/courses/recommend?dept=CS&grade=大三&pathway=軟體開發&limit=12
 */
router.get('/recommend', (req, res) => {
  try {
    const dept = String(req.query.dept || 'CS').toUpperCase();
    if (!['CS', 'IM', 'AI'].includes(dept)) {
      return res.status(400).json({ error: 'Invalid dept. Use CS, IM or AI.' });
    }
    const grade = String(req.query.grade || '大三');
    const pathway = String(req.query.pathway || '');
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 30);
    res.json(getRecommendedCourses({ dept, grade, pathway, limit }));
  } catch (err) {
    console.error('[API /api/courses/recommend Error]:', err);
    res.status(500).json({ error: 'Failed to load recommended courses' });
  }
});

module.exports = router;
