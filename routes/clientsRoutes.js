const express = require('express');
const router = express.Router();
const { fetchClientDetailSheetData } = require('../controllers/ClientsController');

// POST /add-row
router.get('/Clients-details', fetchClientDetailSheetData);

module.exports = router;
