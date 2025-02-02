const { Board, Team } = require("../models");

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

const getBoardsByTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const boards = await Board.findAll({ where: { teamId } });

        res.json({ boards });
    } catch (error) {
        console.error("Error fetching boards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createBoard, getBoardsByTeam };
