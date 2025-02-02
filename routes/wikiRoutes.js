const express = require("express");
const { createCategory, createArticle, getCategories, getArticlesByCategory } = require("../controllers/wikiController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Managers & Team Leaders can create categories
router.post("/category/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createCategory);

// Only Managers & Team Leaders can create articles
router.post("/article/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createArticle);

// Any team member can view categories & articles
router.get("/categories/:teamId", authenticateUser, getCategories);
router.get("/articles/:categoryId", authenticateUser, getArticlesByCategory);

module.exports = router;
