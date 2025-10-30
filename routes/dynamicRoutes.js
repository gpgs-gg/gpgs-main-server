const express = require('express');
const router = express.Router();
const { fetchDynamicSheetData } = require('../controllers/DynamicValueController');

// POST /add-row
router.get('/dynamic-values', fetchDynamicSheetData);

module.exports = router;
