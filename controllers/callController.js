// controllers/callController.js
const {
    Call,
    CallParticipant,
    Conversation,
    ConversationParticipant,
    User
} = require("../models");

// 1. Initiate a call
const initiateCall = async (req, res) => {
    try {
        const { conversationId, type = 'video' } = req.body;
        const initiatorId = req.user.id;
        const teamId = req.user.teamId;

        // Verify conversation and membership
        const convo = await Conversation.findByPk(conversationId, {
            include: [{ model: User, as: 'Users', where: { id: initiatorId } }]
        });
        if (!convo) {
            return res.status(404).json({ message: "Conversation not found or not accessible" });
        }

        // Prevent duplicate active call
        const existing = await Call.findOne({
            where: { conversationId, status: 'active' }
        });
        if (existing) {
            return res.status(400).json({
                message: "An active call already exists in this conversation",
                callId: existing.id
            });
        }

        // Create call
        const call = await Call.create({
            conversationId, initiatorId, type, status: 'active', startTime: new Date()
        });
        await CallParticipant.create({
            callId: call.id, userId: initiatorId, joinTime: new Date()
        });

        // Notify others
        const participants = await ConversationParticipant.findAll({
            where: { conversationId },
            include: [{ model: User }]
        });
        participants.forEach(p => {
            if (p.userId !== initiatorId) {
                req.io.to(`user-${p.userId}`).emit('incomingCall', {
                    callId: call.id,
                    conversationId,
                    initiatorId,
                    type,
                    initiatorName: `${req.user.firstName} ${req.user.lastName}`
                });
            }
        });

        return res.status(201).json({
            message: "Call initiated successfully",
            call,
            roomId: `call-${call.id}`
        });
    } catch (err) {
        console.error("Error initiating call:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// 2. Join a call
const joinCall = async (req, res) => {
    try {
        const callId = parseInt(req.params.callId, 10);
        const userId = req.user.id;

        // 2.1 Does the call exist?
        const call = await Call.findByPk(callId);
        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }

        // 2.2 Is it still active?
        if (call.status !== 'active') {
            return res.status(400).json({ message: "Call has already ended" });
        }

        // 2.3 Is user part of that conversation?
        const inConvo = await ConversationParticipant.findOne({
            where: { conversationId: call.conversationId, userId }
        });
        if (!inConvo) {
            return res.status(403).json({ message: "You are not a participant in this conversation" });
        }

        // 2.4 Have they already joined?
        const already = await CallParticipant.findOne({
            where: { callId, userId, leaveTime: null }
        });
        if (already) {
            return res.status(400).json({ message: "You have already joined this call" });
        }

        // 2.5 Ok, join
        await CallParticipant.create({ callId, userId, joinTime: new Date() });
        req.io.to(`call-${callId}`).emit('userJoinedCall', {
            callId,
            userId,
            userName: `${req.user.firstName} ${req.user.lastName}`
        });
        return res.json({ message: "Joined call successfully", callId, roomId: `call-${callId}` });
    } catch (err) {
        console.error("Error joining call:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// 3. Leave a call
const leaveCall = async (req, res) => {
    try {
        const callId = parseInt(req.params.callId, 10);
        const userId = req.user.id;

        // 3.1 Does the call exist and is active?
        const call = await Call.findByPk(callId);
        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }
        if (call.status !== 'active') {
            return res.status(400).json({ message: "Call has already ended" });
        }

        // 3.2 Is user currently in it?
        const part = await CallParticipant.findOne({
            where: { callId, userId, leaveTime: null }
        });
        if (!part) {
            return res.status(400).json({ message: "You are not currently in this call" });
        }

        // 3.3 Mark leave
        part.leaveTime = new Date();
        await part.save();
        req.io.to(`call-${callId}`).emit('userLeftCall', {
            callId,
            userId,
            userName: `${req.user.firstName} ${req.user.lastName}`
        });

        // 3.4 If none remain, end automatically
        const remaining = await CallParticipant.count({
            where: { callId, leaveTime: null }
        });
        if (remaining === 0) {
            call.status = 'ended';
            call.endTime = new Date();
            await call.save();
            req.io.to(`call-${callId}`).emit('callEnded', {
                callId,
                endedBy: userId,
                endedByName: `${req.user.firstName} ${req.user.lastName}`
            });
        }

        return res.json({ message: "Left call successfully" });
    } catch (err) {
        console.error("Error leaving call:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// 4. End a call (initiator only)
const endCall = async (req, res) => {
    try {
        const callId = parseInt(req.params.callId, 10);
        const userId = req.user.id;

        // 4.1 Lookup
        const call = await Call.findByPk(callId);
        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }
        // 4.2 Only initiator
        if (call.initiatorId !== userId) {
            return res.status(403).json({ message: "Only the call initiator can end this call" });
        }
        // 4.3 Still active?
        if (call.status !== 'active') {
            return res.status(400).json({ message: "Call has already been ended" });
        }

        // 4.4 End it
        call.status = 'ended';
        call.endTime = new Date();
        await call.save();
        await CallParticipant.update(
            { leaveTime: new Date() },
            { where: { callId, leaveTime: null } }
        );
        req.io.to(`call-${callId}`).emit('callEnded', {
            callId,
            endedBy: userId,
            endedByName: `${req.user.firstName} ${req.user.lastName}`
        });

        return res.json({ message: "Call ended successfully" });
    } catch (err) {
        console.error("Error ending call:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// 5. List participants
const getCallParticipants = async (req, res) => {
    try {
        const callId = parseInt(req.params.callId, 10);
        const userId = req.user.id;

        // 5.1 Verify call
        const call = await Call.findByPk(callId);
        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }
        if (call.status !== 'active') {
            return res.status(400).json({ message: "Call has already ended" });
        }

        // 5.2 Verify access via the conversation
        const inConvo = await ConversationParticipant.findOne({
            where: { conversationId: call.conversationId, userId }
        });
        if (!inConvo) {
            return res.status(403).json({ message: "You are not a participant in this conversation" });
        }

        // 5.3 Fetch active participants
        const parts = await CallParticipant.findAll({
            where: { callId, leaveTime: null },
            include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
        });

        const participants = parts.map(p => ({
            id: p.User.id,
            firstName: p.User.firstName,
            lastName: p.User.lastName,
            email: p.User.email,
            joinTime: p.joinTime
        }));

        return res.json({ participants });
    } catch (err) {
        console.error("Error getting call participants:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    initiateCall,
    joinCall,
    leaveCall,
    endCall,
    getCallParticipants
};
