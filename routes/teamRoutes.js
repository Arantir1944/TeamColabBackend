const express = require("express");
const { createTeam, joinTeam, getUserTeam } = require("../controllers/teamController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authenticateUser, createTeam);
router.post("/join", authenticateUser, joinTeam);
router.get("/my-team", authenticateUser, getUserTeam);

module.exports = router;
