// controllers/callController.js
const { Call, CallParticipant, Conversation, User } = require("../models");

// Initialize a new call
const initiateCall = async (req, res) => {
    try {
        const { conversationId, type = 'video' } = req.body;
        const initiatorId = req.user.id;
        const teamId = req.user.teamId;

        // Verify the conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            include: [
                {
                    model: User,
                    where: { id: initiatorId }
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

        // Check if there's already an active call in this conversation
        const activeCall = await Call.findOne({
            where: {
                conversationId,
                status: 'active'
            }
        });

        if (activeCall) {
            return res.status(400).json({
                message: "An active call already exists in this conversation",
                callId: activeCall.id
            });
        }

        // Create the call
        const call = await Call.create({
            conversationId,
            initiatorId,
            type,
            status: 'active',
            startTime: new Date()
        });

        // Add initiator as first participant
        await CallParticipant.create({
            callId: call.id,
            userId: initiatorId,
            joinTime: new Date()
        });

        // Get all conversation participants to notify them
        const participants = await ConversationParticipant.findAll({
            where: { conversationId },
            include: [{ model: User }]
        });

        // Notify all participants except the initiator
        participants.forEach(participant => {
            if (participant.userId !== initiatorId) {
                req.io.to(`user-${participant.userId}`).emit('incomingCall', {
                    callId: call.id,
                    conversationId,
                    initiatorId,
                    type,
                    initiatorName: `${req.user.firstName} ${req.user.lastName}`
                });
            }
        });

        res.status(201).json({
            message: "Call initiated successfully",
            call,
            roomId: `call-${call.id}`  // Room ID for signaling
        });
    } catch (error) {
        console.error("Error initiating call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Join an existing call
const joinCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const userId = req.user.id;
        const teamId = req.user.teamId;

        // Verify the call exists and is active
        const call = await Call.findOne({
            include: [
                {
                    model: Conversation,
                    where: { teamId },
                    include: [
                        {
                            model: User,
                            where: { id: userId } // Ensure user is a participant in the conversation
                        }
                    ]
                }
            ],
            where: {
                id: callId,
                status: 'active'
            }
        });

        if (!call) {
            return res.status(404).json({ message: "Call not found, ended, or not accessible" });
        }

        // Check if user is already in the call
        const existingParticipant = await CallParticipant.findOne({
            where: {
                callId,
                userId,
                leaveTime: null // Only consider active participations
            }
        });

        if (existingParticipant) {
            return res.status(400).json({ message: "You are already in this call" });
        }

        // Add user as participant
        const participant = await CallParticipant.create({
            callId,
            userId,
            joinTime: new Date()
        });

        // Notify other participants that a new user joined
        req.io.to(`call-${callId}`).emit('userJoinedCall', {
            callId,
            userId,
            userName: `${req.user.firstName} ${req.user.lastName}`
        });

        res.json({
            message: "Joined call successfully",
            callId,
            roomId: `call-${callId}`
        });
    } catch (error) {
        console.error("Error joining call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Leave a call
const leaveCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const userId = req.user.id;

        // Update the participant record to set leaveTime
        const participant = await CallParticipant.findOne({
            where: {
                callId,
                userId,
                leaveTime: null // Only consider active participations
            }
        });

        if (!participant) {
            return res.status(404).json({ message: "You are not in this call" });
        }

        participant.leaveTime = new Date();
        await participant.save();

        // Notify other participants that a user left
        req.io.to(`call-${callId}`).emit('userLeftCall', {
            callId,
            userId,
            userName: `${req.user.firstName} ${req.user.lastName}`
        });

        // Check if there are any participants left
        const remainingParticipants = await CallParticipant.findAll({
            where: {
                callId,
                leaveTime: null
            }
        });

        // If no participants left, end the call
        if (remainingParticipants.length === 0) {
            const call = await Call.findByPk(callId);
            call.status = 'ended';
            call.endTime = new Date();
            await call.save();
        }

        res.json({ message: "Left call successfully" });
    } catch (error) {
        console.error("Error leaving call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// End a call (only for initiator)
const endCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const userId = req.user.id;

        // Verify the call exists and user is the initiator
        const call = await Call.findOne({
            where: {
                id: callId,
                initiatorId: userId,
                status: 'active'
            }
        });

        if (!call) {
            return res.status(404).json({ message: "Call not found or you are not the initiator" });
        }

        // Update call status
        call.status = 'ended';
        call.endTime = new Date();
        await call.save();

        // Update all participants to have left
        await CallParticipant.update(
            { leaveTime: new Date() },
            {
                where: {
                    callId,
                    leaveTime: null
                }
            }
        );

        // Notify all participants that the call has ended
        req.io.to(`call-${callId}`).emit('callEnded', {
            callId,
            endedBy: userId,
            endedByName: `${req.user.firstName} ${req.user.lastName}`
        });

        res.json({ message: "Call ended successfully" });
    } catch (error) {
        console.error("Error ending call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get current call participants
const getCallParticipants = async (req, res) => {
    try {
        const { callId } = req.params;
        const userId = req.user.id;
        const teamId = req.user.teamId;

        // Verify the call exists and user is a participant
        const call = await Call.findOne({
            include: [
                {
                    model: Conversation,
                    where: { teamId },
                    include: [
                        {
                            model: User,
                            where: { id: userId } // Ensure user is a participant in the conversation
                        }
                    ]
                }
            ],
            where: {
                id: callId,
                status: 'active'
            }
        });

        if (!call) {
            return res.status(404).json({ message: "Call not found, ended, or not accessible" });
        }

        // Get active participants
        const participants = await CallParticipant.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            where: {
                callId,
                leaveTime: null // Only active participants
            }
        });

        // Transform to a more client-friendly format
        const formattedParticipants = participants.map(p => ({
            id: p.User.id,
            firstName: p.User.firstName,
            lastName: p.User.lastName,
            email: p.User.email,
            joinTime: p.joinTime
        }));

        res.json({ participants: formattedParticipants });
    } catch (error) {
        console.error("Error getting call participants:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    initiateCall,
    joinCall,
    leaveCall,
    endCall,
    getCallParticipants
};