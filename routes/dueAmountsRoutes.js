const express = require('express');
const router = express.Router();

// Ensure the controller path is correct
const { fetchPropertySheetData } = require('../controllers/dueAmountsController');

// Define route for getting the due amounts
router.get('/property-sheet-data-for-accounts', fetchPropertySheetData);

// Export the router to be used in the main server file
module.exports = router;
