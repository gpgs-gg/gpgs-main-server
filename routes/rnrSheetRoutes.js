const express = require('express');
const router = express.Router();

// Ensure the controller path is correct
const { addRowToSheet } = require('../controllers/rnrSheetController');

// Define route for getting the due amounts
router.post('/update-rnr-sheet', addRowToSheet);

// Export the router to be used in the main server file
module.exports = router;
