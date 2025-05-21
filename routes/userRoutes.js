const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { searchUsers } = require('../controllers/userController');


router.get('/', authenticate, searchUsers);

module.exports = router;
