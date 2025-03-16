const { Board, Team } = require("../models");

// Create a new board
const createBoard = async (req, res) => {
    try {
        const { name, teamId } = req.body;

        // Ensure the team exists
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const board = await Board.create({ name, teamId });
        res.status(201).json({ message: "Board created successfully", board });
    } catch (error) {
        console.error("Error creating board:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all boards for the user's team
const getBoardsByTeam = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        if (!teamId) {
            return res.status(403).json({ message: "You are not part of any team" });
        }

        const boards = await Board.findAll({ where: { teamId } });
        res.json({ boards });
    } catch (error) {
        console.error("Error fetching boards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single board (only if it belongs to the user’s team)
const getBoardById = async (req, res) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        const board = await Board.findOne({ where: { id, teamId } });
        if (!board) return res.status(404).json({ message: "Board not found or not accessible" });

        res.json({ board });
    } catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a board (only if the board belongs to the user’s team)
const updateBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const teamId = req.user.teamId;

        const board = await Board.findOne({ where: { id, teamId } });
        if (!board) return res.status(404).json({ message: "Board not found or not accessible" });

        board.name = name || board.name;
        await board.save();

        res.json({ message: "Board updated successfully", board });
    } catch (error) {
        console.error("Error updating board:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a board (only if the board belongs to the user’s team)
const deleteBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        const board = await Board.findOne({ where: { id, teamId } });
        if (!board) return res.status(404).json({ message: "Board not found or not accessible" });

        await board.destroy();
        res.json({ message: "Board deleted successfully" });
    } catch (error) {
        console.error("Error deleting board:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createBoard, getBoardsByTeam, getBoardById, updateBoard, deleteBoard };
