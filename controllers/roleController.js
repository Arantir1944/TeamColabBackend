const { User } = require("../models");

const updateRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const adminId = req.user.id;

        // Check if the requesting user is a Manager
        const adminUser = await User.findByPk(adminId);
        if (!adminUser || adminUser.role !== "Manager") {
            return res.status(403).json({ message: "Permission denied. Only Managers can update roles." });
        }

        // Validate the new role
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
