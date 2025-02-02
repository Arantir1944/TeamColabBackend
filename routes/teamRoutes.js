const express = require("express");
const { createTeam, joinTeam, getUserTeam } = require("../controllers/teamController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/create", authenticateUser, authorizeRoles("Manager"), createTeam);  // Only Managers
router.post("/join", authenticateUser, joinTeam);  // Any user can join
router.get("/my-team", authenticateUser, getUserTeam);

module.exports = router;
