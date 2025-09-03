const express = require('express');
const router = express.Router();
const { fetchPropertiesSheetData } = require('../controllers/PropertiesSheetController');

// POST /add-row
router.get('/properties-data', fetchPropertiesSheetData);

module.exports = router;
