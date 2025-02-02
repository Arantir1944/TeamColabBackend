const express = require("express");
const { updateRole } = require("../controllers/roleController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Managers can update roles
router.put("/update", authenticateUser, authorizeRoles("Manager"), updateRole);

module.exports = router;
