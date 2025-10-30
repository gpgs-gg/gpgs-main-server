const express = require("express");
const router = express.Router();
const {changePassword} = require("../controllers/ChangePasswordController");

router.post("/change-password", changePassword);

module.exports = router;
