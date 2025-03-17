const express = require("express");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    createArticle,
    getArticlesByCategory,
    getArticleById,
    updateArticle,
    deleteArticle
} = require("../controllers/wikiController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Category routes
router.post("/category/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createCategory);
router.get("/categories", authenticateUser, getCategories);
router.get("/category/:id", authenticateUser, getCategoryById);
router.put("/category/:id", authenticateUser, authorizeRoles("Manager", "Team Leader"), updateCategory);
router.delete("/category/:id", authenticateUser, authorizeRoles("Manager", "Team Leader"), deleteCategory);

// Article routes
router.post("/article/create", authenticateUser, authorizeRoles("Manager", "Team Leader"), createArticle);
router.get("/articles/:categoryId", authenticateUser, getArticlesByCategory);
router.get("/article/:id", authenticateUser, getArticleById);
router.put("/article/:id", authenticateUser, authorizeRoles("Manager", "Team Leader"), updateArticle);
router.delete("/article/:id", authenticateUser, authorizeRoles("Manager", "Team Leader"), deleteArticle);

module.exports = router;
