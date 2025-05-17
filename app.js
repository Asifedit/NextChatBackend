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
const wsDecrypt = require("./Sockets/Middleware/wsDecrypt");
const corsOptions = {
    origin: [process.env.FRONTEND_URL, "http://192.168.43.107:5173"],
    credentials: true,
    methods: ["GET", "POST"],
};

// app.use(express.static("./node_modules/@socket.io/admin-ui/ui/dist"));

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

app.use("/req", router);

io.use(VerifyAuth);
io.use(wsDecrypt);

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
