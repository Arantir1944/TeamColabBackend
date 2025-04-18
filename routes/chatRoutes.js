const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// all of these require a valid JWT
router.use(authenticate);

// direct & group convo CRUD
router.post('/conversations/direct', chatController.createDirectConversation);
router.post('/conversations/group', chatController.createGroupConversation);
router.get('/conversations', chatController.getUserConversations);
router.get('/conversations/:id', chatController.getConversationWithMessages);

// sending a message
router.post('/messages', chatController.sendMessage);

module.exports = router;
