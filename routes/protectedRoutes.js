const express = require("express");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", authenticateUser, (req, res) => {
    res.json({ message: `Welcome to your dashboard, user ID: ${req.user.id}` });
});

module.exports = router;
