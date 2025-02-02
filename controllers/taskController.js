const { Task, Board, User } = require("../models");

const createTask = async (req, res) => {
    try {
        const { title, description, boardId, assignedTo } = req.body;

        const board = await Board.findByPk(boardId);
        if (!board) return res.status(404).json({ message: "Board not found" });

        if (assignedTo) {
            const user = await User.findByPk(assignedTo);
            if (!user) return res.status(404).json({ message: "Assigned user not found" });
        }

        const task = await Task.create({ title, description, boardId, assignedTo });

        // Emit real-time task creation event
        req.io.to(`team-${board.teamId}`).emit("taskCreated", task);

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const updateTaskStatus = async (req, res) => {
    try {
        const { taskId, status } = req.body;
        const validStatuses = ["To Do", "In Progress", "Done"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const task = await Task.findByPk(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        if (req.user.role === "Employee" && req.user.id !== task.assignedTo) {
            return res.status(403).json({ message: "You can only update your own tasks." });
        }

        await Task.update({ status }, { where: { id: taskId } });

        // Emit real-time task update event
        req.io.to(`team-${task.boardId}`).emit("taskUpdated", { taskId, status });

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all tasks for a board
const getTasksByBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const tasks = await Task.findAll({ where: { boardId } });

        res.json({ tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createTask, updateTaskStatus, getTasksByBoard };
