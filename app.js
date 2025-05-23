const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const router = require("./Router/MainRought");
const { handelRequest } = require("./Sockets/handelRequest");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const app = express();
const VerifyAuth = require("./Sockets/Middleware/socketAuth");
const corsOptions = {
    origin: process.env.FRONTEND_URL.split(","),
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

app.use(async (req, res, next) => {
    req.io = io;
    next();
});
app.use((req, res, next) => {
    if (process.env.FRONTEND_URL.split(",").includes(req.headers.origin)) {
        next();
    } else {
        return res.status(404).json("Unautorize Request");
    }
});
app.use("/req", router);

io.use(VerifyAuth);

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
