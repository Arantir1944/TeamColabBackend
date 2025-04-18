/ controllers/chatController.js
const { Conversation, ConversationParticipant, Message, User, Team } = require("../models");
const { Op } = require("sequelize");

// Create a direct conversation between two users
const createDirectConversation = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;
        const teamId = req.user.teamId;

        // Check if users are in the same team
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser || targetUser.teamId !== teamId) {
            return res.status(404).json({ message: "User not found or not in your team" });
        }

        // Check if conversation already exists
        const existingConvo = await Conversation.findOne({
            include: [
                {
                    model: User,
                    where: { id: currentUserId }
                },
                {
                    model: User,
                    where: { id: targetUserId }
                }
            ],
            where: {
                type: 'direct',
                teamId: teamId
            }
        });

        if (existingConvo) {
            return res.json({
                message: "Conversation already exists",
                conversation: existingConvo
            });
        }

        // Create new conversation
        const conversation = await Conversation.create({
            type: 'direct',
            teamId: teamId
        });

        // Add both users as participants
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

        // Ensure name is provided for group conversations
        if (!name) {
            return res.status(400).json({ message: "Name is required for group conversations" });
        }

        // Ensure there are at least 2 other participants
        if (!participantIds || participantIds.length < 2) {
            return res.status(400).json({ message: "At least 2 participants required" });
        }

        // Verify all participants are in the same team
        const participants = await User.findAll({
            where: {
                id: { [Op.in]: [...participantIds, currentUserId] },
                teamId: teamId
            }
        });

        if (participants.length !== participantIds.length + 1) {
            return res.status(400).json({ message: "Some users not found or not in your team" });
        }

        // Create new group conversation
        const conversation = await Conversation.create({
            name,
            type: 'group',
            teamId
        });

        // Add all participants
        const participantObjects = [...participantIds, currentUserId].map(userId => ({
            conversationId: conversation.id,
            userId
        }));

        await ConversationParticipant.bulkCreate(participantObjects);

        res.status(201).json({
            message: "Group conversation created successfully",
            conversation
        });
    } catch (error) {
        console.error("Error creating group conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all conversations for the current user
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const teamId = req.user.teamId;

        const conversations = await Conversation.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: { attributes: [] } // Don't include the join table
                },
                {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                }
            ],
            where: {
                teamId,
                '$Users.id$': userId // Only conversations where the user is a participant
            },
            order: [
                [Message, 'createdAt', 'DESC']
            ]
        });

        res.json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a specific conversation with messages
const getConversationWithMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const teamId = req.user.teamId;

        const conversation = await Conversation.findOne({
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: { attributes: [] }
                },
                {
                    model: Message,
                    include: [
                        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }
                    ],
                    order: [['createdAt', 'ASC']]
                }
            ],
            where: {
                id,
                teamId,
                '$Users.id$': userId // Ensure the requesting user is a participant
            }
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found or not accessible" });
        }

        // Update the last read timestamp for this user
        await ConversationParticipant.update(
            { lastRead: new Date() },
            { where: { conversationId: id, userId } }
        );

        res.json({ conversation });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { conversationId, content, type = 'text', fileUrl = null } = req.body;
        const senderId = req.user.id;
        const teamId = req.user.teamId;

        // Verify the conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            include: [
                {
                    model: User,
                    where: { id: senderId }
                }
            ],
            where: {
                id: conversationId,
                teamId
            }
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found or not accessible" });
        }

        // Create the message
        const message = await Message.create({
            conversationId,
            senderId,
            content,
            type,
            fileUrl
        });

        // Get sender details to include in response
        const sender = await User.findByPk(senderId, {
            attributes: ['id', 'firstName', 'lastName']
        });

        const messageWithSender = {
            ...message.toJSON(),
            sender
        };

        // Emit to all participants via socket.io
        const participants = await ConversationParticipant.findAll({
            where: { conversationId }
        });

        participants.forEach(participant => {
            if (participant.userId !== senderId) { // Don't send to the sender
                req.io.to(`user-${participant.userId}`).emit('newMessage', messageWithSender);
            }
        });

        res.status(201).json({ message: "Message sent successfully", sentMessage: messageWithSender });
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