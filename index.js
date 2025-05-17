// index.js
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require("express");
const https = require("https");           // Required for Socket.io
const fs = require("fs");
const sslOptions = {
    key: fs.readFileSync("../ssl/server.key"),
    cert: fs.readFileSync("../ssl/server.cert")
};
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = https.createServer(sslOptions, app);
const io = new Server(server, {
    cors: {
        origin: "*",     // TODO: restrict to your frontend URL in production
        methods: ["GET", "POST"]
    }
});

// Attach `io` to request handlers
const socketMiddleware = require("./middleware/socketMiddleware");
app.use(socketMiddleware(io));

// Standard middleware
app.use(cors());
app.use(express.json());

// WebSocket (Socket.io) handling
io.on("connection", socket => {
    console.log(`Socket connected: ${socket.id}`);

    // Associate this socket with a user room
    socket.on("register", ({ userId }) => {
        socket.join(`user-${userId}`);
        console.log(`→ socket ${socket.id} joined user-${userId}`);
    });

    // Chat room join/leave
    socket.on("joinConversation", conversationId => {
        socket.join(`conversation-${conversationId}`);
        console.log(`→ socket ${socket.id} joined conversation-${conversationId}`);
    });
    socket.on("leaveConversation", conversationId => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`→ socket ${socket.id} left conversation-${conversationId}`);
    });

    // (Optional) team rooms for other real‑time features
    socket.on("joinTeam", teamId => {
        socket.join(`team-${teamId}`);
        console.log(`→ socket ${socket.id} joined team-${teamId}`);
    });

    // WebRTC signaling for calls
    socket.on("offer", payload => {
        io.to(`call-${payload.callId}`).emit("offer", payload);
    });
    socket.on("answer", payload => {
        io.to(`call-${payload.callId}`).emit("answer", payload);
    });
    socket.on("ice-candidate", payload => {
        io.to(`call-${payload.callId}`).emit("ice-candidate", payload);
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Health‑check endpoint
app.get("/", (req, res) => {
    res.send("Team Hub Backend is Running!");
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/protected", require("./routes/protectedRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/boards", require("./routes/boardRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/wiki", require("./routes/wikiRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/calls", require("./routes/callRoutes"));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
