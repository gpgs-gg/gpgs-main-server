const express = require("express");
const router = express.Router();
const { BedAvailableSheetData } = require("../controllers/BedsAvilableController");

router.get("/Beds-status", BedAvailableSheetData);

module.exports = router;
