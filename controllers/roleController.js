const { User } = require("../models");

// Define valid roles as a constant
const VALID_ROLES = ["Manager", "Team Leader", "Employee"];

// Update a user's role (only accessible by Managers)
const updateRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const managerId = req.user.id;

        // Ensure the requesting user is a Manager
        const managerUser = await User.findByPk(managerId);
        if (!managerUser || managerUser.role !== "Manager") {
            return res.status(403).json({ message: "Only Managers can update roles." });
        }

        // Ensure only valid roles are assigned
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided." });
        }

        // Update the user's role
        await User.update({ role }, { where: { id: userId } });

        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a list of valid roles
const getRoles = async (req, res) => {
    try {
        res.json({ roles: VALID_ROLES });
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { updateRole, getRoles };
