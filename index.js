require("dotenv").config();
const express = require("express");
const http = require("http"); // Required for WebSockets
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Change this to your frontend URL in production
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach `io` to requests using middleware
const socketMiddleware = require("./middleware/socketMiddleware");
app.use(socketMiddleware(io));

// WebSocket handling
io.on("connection", socket => {
    // identify the user’s socket-room
    socket.on("register", ({ userId }) => {
        socket.join(`user-${userId}`);
    });

    // chat rooms
    socket.on("joinConversation", conversationId => {
        socket.join(`conversation-${conversationId}`);
    });
    socket.on("leaveConversation", conversationId => {
        socket.leave(`conversation-${conversationId}`);
    });

    // WebRTC signaling for calls
    socket.on("offer", payload => io.to(`call-${payload.callId}`).emit("offer", payload));
    socket.on("answer", payload => io.to(`call-${payload.callId}`).emit("answer", payload));
    socket.on("ice-candidate", payload => io.to(`call-${payload.callId}`).emit("ice-candidate", payload));

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


// Routes
app.get("/", (req, res) => {
    res.send("Team Hub Backend is Running!");
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const protectedRoutes = require("./routes/protectedRoutes");
app.use("/api/protected", protectedRoutes);

const teamRoutes = require("./routes/teamRoutes");
app.use("/api/teams", teamRoutes);

const roleRoutes = require("./routes/roleRoutes");
app.use("/api/roles", roleRoutes);

const boardRoutes = require("./routes/boardRoutes");
app.use("/api/boards", boardRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const wikiRoutes = require("./routes/wikiRoutes");
app.use("/api/wiki", wikiRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

const callRoutes = require("./routes/callRoutes");
app.use("/api/calls", callRoutes);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
