const { WikiCategory, WikiArticle, Team } = require("../models");

// ----------- Category CRUD -----------

// Create a new category (Only Managers & Team Leaders)
const createCategory = async (req, res) => {
    try {
        const { name, teamId } = req.body;

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

// Get all categories for a team
const getCategories = async (req, res) => {
    try {
        const { teamId } = req.params;
        const categories = await WikiCategory.findAll({ where: { teamId } });
        res.json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ category });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a category (Only Managers & Team Leaders)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        category.name = name || category.name;
        await category.save();

        res.json({ message: "Category updated successfully", category });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a category (Only Managers & Team Leaders)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WikiCategory.findByPk(id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        await category.destroy();
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ----------- Article CRUD -----------

// Create a new article (Only Managers & Team Leaders)
const createArticle = async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;
        const authorId = req.user.id;  // Extracted from JWT token

        const category = await WikiCategory.findByPk(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const article = await WikiArticle.create({ title, content, categoryId, authorId });
        res.status(201).json({ message: "Article created successfully", article });
    } catch (error) {
        console.error("Error creating article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all articles by category
const getArticlesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const articles = await WikiArticle.findAll({ where: { categoryId } });
        res.json({ articles });
    } catch (error) {
        console.error("Error fetching articles:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single article by ID
const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await WikiArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });
        res.json({ article });
    } catch (error) {
        console.error("Error fetching article:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update an article (Only Managers & Team Leaders)
const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categoryId } = req.body;
        const article = await WikiArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });

        // If a new category is provided, verify it exists
        if (categoryId) {
            const category = await WikiCategory.findByPk(categoryId);
            if (!category) return res.status(404).json({ message: "Category not found" });
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

// Delete an article (Only Managers & Team Leaders)
const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await WikiArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });

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
