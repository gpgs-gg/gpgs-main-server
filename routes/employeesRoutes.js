const express = require('express');
const router = express.Router();
const { fetchEmployeesDetailSheetData } = require('../controllers/EmployeesController');

// POST /add-row
router.get('/Employees-details', fetchEmployeesDetailSheetData);

module.exports = router;
