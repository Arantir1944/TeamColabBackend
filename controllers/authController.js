const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const register = async (req, res) => {
    try {
        // Since the route is protected, req.user is a Manager.
        const { firstName, lastName, email, password, role } = req.body;
        const validRoles = ["Manager", "Team Leader", "Employee"];

        // Validate role if provided.
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided" });
        }

        let user = await User.findOne({ where: { email } });
        if (user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || "Employee" // Use provided role or default.
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error during user registration:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Generate JWT with `role`
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // 🔹 Add `role`
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // authController.js (modified)
        res.json({
            token: `Bearer ${token}`,
            tokenType: 'Bearer',
            expiresIn: 3600  // in seconds (1 hour)
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
module.exports = { register, login };
