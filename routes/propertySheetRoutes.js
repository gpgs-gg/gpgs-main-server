const express = require('express');
const router = express.Router();
const { fetchPropertySheetData } = require('../controllers/PropertySheetController');

// Match this route exactly to your frontend call
router.get('/property-sheet-data-for-new-booking', fetchPropertySheetData);

module.exports = router;
