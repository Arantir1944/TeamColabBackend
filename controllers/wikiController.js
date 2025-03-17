const { WikiCategory, WikiArticle, Team } = require("../models");

// ----------- Category CRUD -----------

// Create a new category using the team ID from the authenticated user
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const teamId = req.user.teamId;
        if (!teamId) return res.status(403).json({ message: "User is not associated with a team." });

        // Ensure the team exists
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const category = await WikiCategory.create({ name, teamId });
        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all categories for the user's team
const getCategories = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        if (!teamId) return res.status(403).json({ message: "User is not associated with a team." });

        const categories = await WikiCategory.findAll({ where: { teamId } });
        res.json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single category by ID (only if it belongs to the user’s team)
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (category.teamId !== req.user.teamId) return res.status(403).json({ message: "Unauthorized" });
        res.json({ category });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a category (only if it belongs to the user’s team)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (category.teamId !== req.user.teamId) return res.status(403).json({ message: "Unauthorized" });

        category.name = name || category.name;
        await category.save();
        res.json({ message: "Category updated successfully", category });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a category (only if it belongs to the user’s team)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (category.teamId !== req.user.teamId) return res.status(403).json({ message: "Unauthorized" });

        await category.destroy();
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ----------- Article CRUD -----------

// Create a new article; ensure the category belongs to the user's team
const createArticle = async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;
        const authorId = req.user.id;
        const category = await WikiCategory.findByPk(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (category.teamId !== req.user.teamId)
            return res.status(403).json({ message: "Unauthorized to add article to this category" });

        const article = await WikiArticle.create({ title, content, categoryId, authorId });
        res.status(201).json({ message: "Article created successfully", article });
    } catch (error) {
        console.error("Error creating article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all articles by category (if the category belongs to the user's team)
const getArticlesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await WikiCategory.findByPk(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (category.teamId !== req.user.teamId)
            return res.status(403).json({ message: "Unauthorized" });

        const articles = await WikiArticle.findAll({ where: { categoryId } });
        res.json({ articles });
    } catch (error) {
        console.error("Error fetching articles:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single article by ID (only if it belongs to the user's team)
const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        // Include the associated category to verify team ownership
        const article = await WikiArticle.findByPk(id, { include: WikiCategory });
        if (!article) return res.status(404).json({ message: "Article not found" });
        if (article.WikiCategory.teamId !== req.user.teamId)
            return res.status(403).json({ message: "Unauthorized" });
        res.json({ article });
    } catch (error) {
        console.error("Error fetching article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update an article (only if it belongs to the user's team)
const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categoryId } = req.body;
        const article = await WikiArticle.findByPk(id, { include: WikiCategory });
        if (!article) return res.status(404).json({ message: "Article not found" });
        if (article.WikiCategory.teamId !== req.user.teamId)
            return res.status(403).json({ message: "Unauthorized" });

        // If changing the category, ensure the new category belongs to the user's team
        if (categoryId) {
            const newCategory = await WikiCategory.findByPk(categoryId);
            if (!newCategory) return res.status(404).json({ message: "Category not found" });
            if (newCategory.teamId !== req.user.teamId)
                return res.status(403).json({ message: "Unauthorized" });
            article.categoryId = categoryId;
        }

        article.title = title || article.title;
        article.content = content || article.content;
        await article.save();
        res.json({ message: "Article updated successfully", article });
    } catch (error) {
        console.error("Error updating article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete an article (only if it belongs to the user's team)
const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await WikiArticle.findByPk(id, { include: WikiCategory });
        if (!article) return res.status(404).json({ message: "Article not found" });
        if (article.WikiCategory.teamId !== req.user.teamId)
            return res.status(403).json({ message: "Unauthorized" });

        await article.destroy();
        res.json({ message: "Article deleted successfully" });
    } catch (error) {
        console.error("Error deleting article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
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
};
