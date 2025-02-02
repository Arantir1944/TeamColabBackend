const express = require("express");
const { createTask, updateTaskStatus, getTasksByBoard } = require("../controllers/taskController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Managers & Team Leaders can create tasks
router.post("/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createTask);

// Employees can only update their own tasks
router.put("/update-status", authenticateUser, updateTaskStatus);

// Any team member can view tasks in a board
router.get("/:boardId", authenticateUser, getTasksByBoard);

module.exports = router;
