const express = require('express');
const router = express.Router();

// Ensure the controller path is correct
const { fetchPropertySheetDataForClient } = require('../controllers/MainSheetDataForClientController');

// Define route for getting the due amounts
router.get('/property-sheet-data-for-Client', fetchPropertySheetDataForClient);

// Export the router to be used in the main server file
module.exports = router;
