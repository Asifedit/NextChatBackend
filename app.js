const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const { handelRequest } = require("./Sockets/handelRequest");
const router = require("./Router/Rought");
const jwt = require("jsonwebtoken");
const ImageKit = require("imagekit");
const { instrument } = require("@socket.io/admin-ui");
const Redis = require("ioredis");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
};

const imagekit = new ImageKit({
    publicKey: process.env.ik_publicKey,
    privateKey: process.env.ik_privateKey,
    urlEndpoint: process.env.ik_urlEndpoint,
});

app.use(express.static("./node_modules/@socket.io/admin-ui/ui/dist"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

// const redis = new Redis(process.env.UPSTASH_REDIS_Url);


const io = require("socket.io")(server, {
    transports: ["websocket", "polling"],
    cors: true,
});

instrument(io, {
    namespaceName: "/custom/username=asif",
    auth: false,
});

app.use(async (req, res, next) => {
    req.io = io;
    // req.redisClient = await redis;
    next();
});
app.use("/req", router);

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


mongoose
    .connect(process.env.MongoDBUri || "mongodb://localhost:27017/msg", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

io.on("connection", (socket) => handelRequest(socket, io));





server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
  