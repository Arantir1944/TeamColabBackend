const bcrypt = require("bcrypt");
const { User } = require("../models");
const { Op } = require('sequelize');


// Get a user by ID
const getUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a user by ID
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, password, role, teamId } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check for email conflicts if the email is being changed.
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) return res.status(400).json({ message: "Email already in use" });
        }

        // Update fields if provided.
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.teamId = teamId || user.teamId;
        user.role = role || user.role;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        if (role) {
            const validRoles = ["Manager", "Team Leader", "Employee"];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: "Invalid role provided" });
            }
            user.role = role;
        }

        await user.save();
        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        await user.destroy();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const searchUsers = async (req, res) => {
    const search = req.query.search || '';
    const currentUserId = req.user.id;

    try {
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: currentUserId },
                [Op.or]: [
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ]
            },
            attributes: ['id', 'firstName', 'lastName', 'email']
        });

        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search users' });
    }
};

module.exports = { getUser, updateUser, deleteUser, searchUsers };
