const { Task, Board, User } = require("../models");

// Create a new task
const createTask = async (req, res) => {
    try {
        const { title, description, boardId, assignedTo } = req.body;
        const teamId = req.user.teamId;

        // Verify board exists and belongs to the user's team
        const board = await Board.findOne({ where: { id: boardId, teamId } });
        if (!board) return res.status(404).json({ message: "Board not found or not accessible" });

        // If an assignee is provided, verify the user exists
        if (assignedTo) {
            const user = await User.findByPk(assignedTo);
            if (!user) return res.status(404).json({ message: "Assigned user not found" });
        }

        const task = await Task.create({ title, description, boardId, assignedTo });
        req.io.to(`team-${teamId}`).emit("taskCreated", task);

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all tasks for a specific board
const getTasksByBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const teamId = req.user.teamId;

        const board = await Board.findOne({ where: { id: boardId, teamId } });
        if (!board) return res.status(404).json({ message: "Board not found or not accessible" });

        const tasks = await Task.findAll({ where: { boardId }, order: [['id', 'ASC']] });
        res.json({ tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single task by its ID
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        const task = await Task.findOne({ where: { id }, include: [{ model: Board, where: { teamId } }] });
        if (!task) return res.status(404).json({ message: "Task not found or not accessible" });

        res.json({ task });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, boardId, assignedTo, status } = req.body;
        const teamId = req.user.teamId;

        const task = await Task.findOne({ where: { id }, include: [{ model: Board, where: { teamId } }] });
        if (!task) return res.status(404).json({ message: "Task not found or not accessible" });

        if (assignedTo && assignedTo !== task.assignedTo) {
            const user = await User.findByPk(assignedTo);
            if (!user) return res.status(404).json({ message: "Assigned user not found" });
            task.assignedTo = assignedTo;
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (status) {
            const validStatuses = ["To Do", "In Progress", "Done"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            task.status = status;
        }

        await task.save();
        req.io.to(`team-${teamId}`).emit("taskUpdated", task);

        res.json({ message: "Task updated successfully", task });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        const task = await Task.findOne({ where: { id }, include: [{ model: Board, where: { teamId } }] });
        if (!task) return res.status(404).json({ message: "Task not found or not accessible" });

        await task.destroy();
        req.io.to(`team-${teamId}`).emit("taskDeleted", { taskId: id });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createTask, getTasksByBoard, getTaskById, updateTask, deleteTask };