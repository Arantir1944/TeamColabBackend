const { Team, User } = require("../models");

// Create a new team
const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const team = await Team.create({ name });
        res.status(201).json({ message: "Team created successfully", team });
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a team by ID (with associated users)
const getTeamById = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findByPk(teamId, { include: User });
        if (!team) return res.status(404).json({ message: "Team not found" });

        res.status(200).json({ team });
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all teams (with associated users)
const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.findAll({ include: User });
        res.status(200).json({ teams });
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a team by ID
const updateTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        const { name } = req.body;
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        team.name = name || team.name;
        await team.save();

        res.status(200).json({ message: "Team updated successfully", team });
    } catch (error) {
        console.error("Error updating team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a team by ID
const deleteTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        await team.destroy();
        res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Allow a user to join a team (requires user's id in req.user from JWT)
const joinTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        const userId = req.user.id;

        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        await User.update({ teamId }, { where: { id: userId } });
        res.status(200).json({ message: "Joined team successfully", team });
    } catch (error) {
        console.error("Error joining team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get the team associated with the authenticated user
const getUserTeam = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { include: Team });
        if (!user || !user.Team) return res.status(404).json({ message: "No team found" });

        res.status(200).json({ team: user.Team });
    } catch (error) {
        console.error("Error fetching user team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createTeam,
    getTeamById,
    getAllTeams,
    updateTeam,
    deleteTeam,
    joinTeam,
    getUserTeam
};
