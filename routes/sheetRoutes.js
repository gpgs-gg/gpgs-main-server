const express = require('express');
const router = express.Router();
const { addRowToSheet } = require('../controllers/sheetController');

// POST /add-row
router.post('/add-row', addRowToSheet);

module.exports = router;
