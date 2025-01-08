const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const { handelRequest } = require("./Sockets/handelRequest");
const router = require("./Router/Rought");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const ejs = require("ejs");
const path = require("path");
const PORT = process.env.PORT || 5000;
const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL, // Allow all origins
    credentials: true,
    methods: ["GET", "POST"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = require("socket.io")(server, {
    transports: ["websocket", "polling"],
    cors: true,
});

mongoose
    .connect(process.env.MongoDBUri || "mongodb://localhost:27017/msg", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

io.use((socket, next) => {
    const token = socket.request.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith("AccessToken="))
        ?.split("=")[1];

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }
    socket.username = jwt.verify(
        token,
        process.env.jwt_AcessToken_Secret
    ).username;

    next();
});

io.on("connection", (socket) => handelRequest(socket, io));
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use("/req", router);

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "/templates"));

app.get("/welcome", (req, res) => {
    const data = {
        name: "John Doe",
    };

    res.render("welcome", data);
});
app.get("/verification", (req, res) => {
    const data = {
        name: "Nex Chat",
        verificationCode: "65897",
    };

    res.render("verification", data);
});

// const sendMail = require("./utils/Nodemaler");

// // Sample: Send a welcome email
// sendMail("welcome", "asifhossin867@gmail.com", { name: "John Doe" })
//     .then((response) => console.log(response))
//     .catch((error) => console.error(error));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
