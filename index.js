const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
let server;

if (process.env.NODE_ENV === "production") {
    const https = require("https");
    const sslOptions = {
        key: fs.readFileSync("../ssl/server.key"),
        cert: fs.readFileSync("../ssl/server.cert")
    };
    server = https.createServer(sslOptions, app);
} else {
    const http = require("http");
    server = http.createServer(app);
}

const io = new Server(server, {
    cors: {
        origin: "*", // TODO: restrict to your frontend domain in production
        methods: ["GET", "POST"]
    }
});

// Attach socket middleware and handlers
const socketMiddleware = require("./middleware/socketMiddleware");
app.use(socketMiddleware(io));

app.use(cors());
app.use(express.json());

// Socket.IO logic
io.on("connection", socket => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("register", ({ userId }) => socket.join(`user-${userId}`));
    socket.on("joinConversation", id => socket.join(`conversation-${id}`));
    socket.on("leaveConversation", id => socket.leave(`conversation-${id}`));
    socket.on("joinTeam", id => socket.join(`team-${id}`));

    socket.on("offer", payload => io.to(`call-${payload.callId}`).emit("offer", payload));
    socket.on("answer", payload => io.to(`call-${payload.callId}`).emit("answer", payload));
    socket.on("ice-candidate", payload => io.to(`call-${payload.callId}`).emit("ice-candidate", payload));

    socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
});

// Health check
app.get("/", (req, res) => res.send("Team Hub Backend is Running!"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/protected", require("./routes/protectedRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/boards", require("./routes/boardRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/wiki", require("./routes/wikiRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/calls", require("./routes/callRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
