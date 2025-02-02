const { WikiCategory, WikiArticle, Team } = require("../models");

// Create a new category (Only Managers & Team Leaders)
const createCategory = async (req, res) => {
    try {
        const { name, teamId } = req.body;

        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const category = await WikiCategory.create({ name, teamId });

        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new article (Only Managers & Team Leaders)
const createArticle = async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;
        const authorId = req.user.id;

        const category = await WikiCategory.findByPk(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const article = await WikiArticle.create({ title, content, categoryId, authorId });

        res.status(201).json({ message: "Article created successfully", article });
    } catch (error) {
        console.error("Error creating article:", error);
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

// Get articles by category
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

module.exports = { createCategory, createArticle, getCategories, getArticlesByCategory };
