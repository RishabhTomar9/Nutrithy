const express = require('express');
const router = express.Router();
const { generate } = require('../controllers/aiController');

// POST /api/ai/generate
router.post('/generate', generate);

module.exports = router;
