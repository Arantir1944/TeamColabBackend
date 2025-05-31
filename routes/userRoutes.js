const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
    getUser,
    updateUser,
    deleteUser,
    searchUsers
} = require('../controllers/userController');

// GET /api/users?search=... → search users (used in searchUsers)
router.get('/', authenticate, searchUsers);

// GET /api/users/:id → get user by ID
router.get('/:id', authenticate, getUser);

// PUT /api/users/:id → update user
router.put('/:id', authenticate, updateUser);

// DELETE /api/users/:id → delete user
router.delete('/:id', authenticate, deleteUser);

module.exports = router;
