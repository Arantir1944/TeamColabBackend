const express = require("express");
const { createBoard, getBoardsByTeam, deleteBoard } = require("../controllers/boardController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ✅ Fix: Get all boards for the logged-in user's team
router.get("/", authenticateUser, getBoardsByTeam);

// ✅ Fix: Ensure board creation route is correct
router.post("/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createBoard);
// ✅ Ensure this route exists
router.delete("/:id", authenticateUser, authorizeRoles("Manager", "Team Leader"), deleteBoard);


module.exports = router;
