const express = require("express");
const {
    createTask,
    getTasksByBoard,
    getTaskById,  // Make sure this exists
    updateTask,   // Ensure updateTask is included
    deleteTask    // Ensure deleteTask is included
} = require("../controllers/taskController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Managers & Team Leaders can create tasks
router.post("/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createTask);

// Any team member can view tasks in a board
router.get("/:boardId", authenticateUser, getTasksByBoard);

// Get a single task by its ID
router.get("/task/:id", authenticateUser, getTaskById);

// Update a task (only if authorized)
router.put("/update/:id", authenticateUser, updateTask);

// Delete a task (only if authorized)
router.delete("/delete/:id", authenticateUser, deleteTask);

module.exports = router;
