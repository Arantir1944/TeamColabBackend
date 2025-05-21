// teamRoutes.js
const express = require("express");
const { createTeam, joinTeam, getUserTeam, getAllTeams } = require("../controllers/teamController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Make this route public by removing authenticateUser.
router.get("/", authenticateUser, getAllTeams);

router.post("/create", authenticateUser, createTeam);  // Only Managers
//router.post("/join", authenticateUser, joinTeam);  // Any user can join
router.get("/user", authenticateUser, getUserTeam);

module.exports = router;
