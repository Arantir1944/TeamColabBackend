const { Team, User } = require("../models");

const createTeam = async (req, res) => {
    try {
        const { name } = req.body;

        // Create a new team
        const team = await Team.create({ name });

        res.status(201).json({ message: "Team created successfully", team });
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const joinTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        const userId = req.user.id; // Extracted from JWT token

        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        await User.update({ teamId }, { where: { id: userId } });

        res.json({ message: "Joined team successfully", team });
    } catch (error) {
        console.error("Error joining team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getUserTeam = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { include: Team });
        if (!user || !user.Team) return res.status(404).json({ message: "No team found" });

        res.json({ team: user.Team });
    } catch (error) {
        console.error("Error fetching user team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createTeam, joinTeam, getUserTeam };
