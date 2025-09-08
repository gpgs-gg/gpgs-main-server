const express = require('express');
const router = express.Router();

const { CreateTicket, updateTicketSheetData } = require('../controllers/CreateTicketController');

// POST /add-row
router.post('/ticket-created', CreateTicket);
router.post('/ticket-updated', updateTicketSheetData);

module.exports = router;
