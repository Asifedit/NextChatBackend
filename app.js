const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const { handelRequest } = require("./Sockets/handelRequest");
const router = require("./Router/Rought");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

// List of allowed origins for CORS (can be extended in the future)
const allowedOrigins = [
   "https://f9db9a2c.nextchatfrontend.pages.dev"
];

// CORS setup for Express
const corsOptions = {
    origin: function (origin, callback) {
        // If the origin is in the allowed list or no origin (e.g., for testing tools like Postman)
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow cookies to be sent with the request
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
};

app.use(cors(corsOptions)); // Use custom CORS options
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));

// Set up HTTP server and Socket.io
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = require("socket.io")(server, {
    cors: {
        origin: function (origin, callback) {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST"],
        credentials: true, // Allow credentials (cookies)
    },
});

app.use((req, res, next) => {
    req.io = io; // Attach Socket.io instance to the request object
    next();
});

// MongoDB connection
mongoose
    .connect(process.env.MongoDBUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// Test endpoint for CORS testing
app.get("/test", (req, res) => {
    res.json({ message: "CORS is working!" });
});

// Route setup
app.use("/req", router);

// Socket.io connection
io.on("connection", (socket) => handelRequest(socket, io));


// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

