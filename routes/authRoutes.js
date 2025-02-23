const express = require("express");
const { register, login } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Protect registration: only an authenticated Manager can register a new user.
router.post("/register", authenticateUser, authorizeRoles("Manager"), register);
router.post("/login", login);

module.exports = router;
