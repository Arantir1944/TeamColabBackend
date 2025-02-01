const express = require("express");
const { updateRole } = require("../controllers/roleController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/update", authenticateUser, updateRole);

module.exports = router;
