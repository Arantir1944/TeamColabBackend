// controllers/chatController.js
const {
    Conversation,
    ConversationParticipant,
    Message,
    User
} = require("../models");
const { Op } = require("sequelize");

// Create a direct conversation between two users
const createDirectConversation = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;
        const teamId = req.user.teamId;

        // Ensure the target user is on the same team
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser || targetUser.teamId !== teamId) {
            return res.status(404).json({ message: "User not found or not in your team" });
        }

        // Check for an existing direct conversation
        const existingConvo = await Conversation.findOne({
            where: { type: "direct", teamId },
            include: [
                { model: User, as: "Users", where: { id: currentUserId } },
                { model: User, as: "Users", where: { id: targetUserId } }
            ]
        });

        if (existingConvo) {
            return res.json({
                message: "Conversation already exists",
                conversation: existingConvo
            });
        }

        // Create and add participants
        const conversation = await Conversation.create({ type: "direct", teamId });
        await ConversationParticipant.bulkCreate([
            { conversationId: conversation.id, userId: currentUserId },
            { conversationId: conversation.id, userId: targetUserId }
        ]);

        res.status(201).json({
            message: "Conversation created successfully",
            conversation
        });
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create a group conversation
const createGroupConversation = async (req, res) => {
    try {
        const { name, participantIds } = req.body;
        const currentUserId = req.user.id;
        const teamId = req.user.teamId;

        if (!name) {
            return res.status(400).json({ message: "Name is required for group conversations" });
        }
        if (!participantIds || participantIds.length < 2) {
            return res.status(400).json({ message: "At least 2 participants required" });
        }

        // Verify everyone is in the same team
        const participants = await User.findAll({
            where: {
                id: { [Op.in]: [...participantIds, currentUserId] },
                teamId
            }
        });
        if (participants.length !== participantIds.length + 1) {
            return res.status(400).json({ message: "Some users not found or not in your team" });
        }

        const conversation = await Conversation.create({ name, type: "group", teamId });
        const rows = [...participantIds, currentUserId].map(userId => ({
            conversationId: conversation.id,
            userId
        }));
        await ConversationParticipant.bulkCreate(rows);

        res.status(201).json({
            message: "Group conversation created successfully",
            conversation
        });
    } catch (error) {
        console.error("Error creating group conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// List all conversations for the current user
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const teamId = req.user.teamId;

        // 1) find all convo IDs this user is in
        const rows = await ConversationParticipant.findAll({
            where: { userId },
            attributes: ["conversationId"]
        });
        const convoIds = rows.map(r => r.conversationId);

        // 2) load those conversations with participants
        const conversations = await Conversation.findAll({
            where: { id: convoIds, teamId },
            include: [
                {
                    model: User,
                    as: "Users",
                    attributes: ["id", "firstName", "lastName", "email"],
                    through: { attributes: [] }
                }
            ],
            order: [["updatedAt", "DESC"]]
        });

        res.json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a specific conversation and all its messages
const getConversationWithMessages = async (req, res) => {
    try {
        const convoId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const teamId = req.user.teamId;

        // 1) Verify the user is a participant
        const participation = await ConversationParticipant.findOne({
            where: { conversationId: convoId, userId }
        });
        if (!participation) {
            return res
                .status(404)
                .json({ message: "Conversation not found or not accessible" });
        }

        // 2) Load the conversation, all users, and its messages
        const conversation = await Conversation.findOne({
            where: { id: convoId, teamId },
            include: [
                {
                    model: User,
                    as: "Users",
                    attributes: ["id", "firstName", "lastName", "email"],
                    through: { attributes: [] }
                },
                {
                    model: Message,
                    as: "Messages",
                    include: [
                        {
                            model: User,
                            as: "sender",
                            attributes: ["id", "firstName", "lastName"]
                        }
                    ],
                    order: [["createdAt", "ASC"]]
                }
            ]
        });

        // should never happen, but just in case
        if (!conversation) {
            return res
                .status(404)
                .json({ message: "Conversation not found or not accessible" });
        }

        // 3) Mark as read
        await ConversationParticipant.update(
            { lastRead: new Date() },
            { where: { conversationId: convoId, userId } }
        );

        // 4) Respond
        res.json({ conversation });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { conversationId, content, type = "text", fileUrl = null } = req.body;
        const senderId = req.user.id;
        const teamId = req.user.teamId;

        // verify access
        const convo = await Conversation.findOne({
            where: { id: conversationId, teamId },
            include: [{ model: User, as: "Users", where: { id: senderId } }]
        });
        if (!convo) {
            return res.status(404).json({ message: "Conversation not found or not accessible" });
        }

        // create + emit
        const message = await Message.create({ conversationId, senderId, content, type, fileUrl });
        const sender = await User.findByPk(senderId, {
            attributes: ["id", "firstName", "lastName"]
        });
        const payload = { ...message.toJSON(), sender };

        const participants = await ConversationParticipant.findAll({
            where: { conversationId }
        });
        participants.forEach(p => {
            if (p.userId !== senderId) {
                req.io.to(`user-${p.userId}`).emit("newMessage", payload);
            }
        });

        res.status(201).json({ message: "Message sent successfully", sentMessage: payload });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createDirectConversation,
    createGroupConversation,
    getUserConversations,
    getConversationWithMessages,
    sendMessage
};
