const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const { handelRequest } = require("./Sockets/handelRequest");
const router = require("./router/Rought");
require("dotenv").config();
const {
    generateRegistrationOptions,
    generateAuthenticationOptions,
    verifyRegistrationResponse,
    verifyAuthenticationResponse,
    Base64URLString,
} = require("@simplewebauthn/server");
const PORT = process.env.PORT || 5000;
const app = express(); 

// List of allowed origins for CORS (can be extended in the future)
const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.43.107:5173",
    "http://172.26.112.1:5173",
    "http://172.23.160.1:5173", 
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
    .connect("mongodb://localhost:27017/msg", {
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

let users = []; // Example in-memory user store

// Register passkey
app.post("/req/webauthn/register",async (req, res) => { 
    const user = { id: "userid", name: "username" }; // Replace with actual user data
    console.log(user);
    const options = await generateRegistrationOptions({
        rpName: "MyApp",
        rpID: "localhost",
        userName: user.name,
    }); 
    user.challenge = options.challenge; // Store challenge for verification
    console.log(options);
    
    res.json(options);
});

// Verify registration
app.post("/api/webauthn/register/verify", (req, res) => {
    const { response } = req.body;
    const isValid = verifyRegistrationResponse({
        response,
        expectedChallenge: users[0].challenge,
        expectedOrigin: "https://example.com",
        expectedRPID: "example.com",
    });
    if (isValid) {
        res.status(200).send("Passkey registration successful!");
    } else {
        res.status(400).send("Invalid registration");
    }
});

// Authenticate passkey
app.post("/api/webauthn/authenticate", (req, res) => {
    const options = generateAuthenticationOptions({
        rpID: "example.com",
        userID: "user-id",
    });
    users[0].challenge = options.challenge;
    res.json(options);
});

// Verify authentication
app.post("/api/webauthn/authenticate/verify", (req, res) => {
    const { response } = req.body;
    const isValid = verifyAuthenticationResponse({
        response,
        expectedChallenge: users[0].challenge,
        expectedOrigin: "https://example.com",
        expectedRPID: "example.com",
    });
    if (isValid) {
        res.status(200).send("Login successful!");
    } else {
        res.status(400).send("Invalid authentication");
    }
});


// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
