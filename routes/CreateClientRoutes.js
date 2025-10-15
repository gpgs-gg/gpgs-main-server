const express = require('express');
const router = express.Router();
const { ClientCreation } = require('../controllers/CreateClientController');

// POST /add-row
router.post('/create-client', ClientCreation);

module.exports = router;
