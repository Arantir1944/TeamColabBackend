const express = require("express");
const { createBoard, getBoardsByTeam } = require("../controllers/boardController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Managers and Team Leaders can create a board
router.post("/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createBoard);

// Anyone in the team can view boards
router.get("/:teamId", authenticateUser, getBoardsByTeam);

module.exports = router;
