const { User } = require("../models");

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
        const validRoles = ["Manager", "Team Leader", "Employee"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided." });
        }

        // Update user role
        await User.update({ role }, { where: { id: userId } });

        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { updateRole };
