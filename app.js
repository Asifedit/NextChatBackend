const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const { handelRequest } = require("./Sockets/handelRequest");
const router = require("./Router/Rought");
const os = require("os");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

// Allow all origins
const corsOptions = {
    origin: "*", // Allow all origins
    credentials: true,
    methods: ["GET", "POST"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = require("socket.io")(server, {
    transports: ['websocket', 'polling'],
    cors: true,
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

mongoose
    .connect(process.env.MongoDBUri || "mongodb://localhost:27017/msg", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

app.get("/test", (req, res) => {
    res.json({ message: "CORS is working!" });
});

app.use("/req", router);
io.on("connection", (socket) => handelRequest(socket, io));

const ChackApikey = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (
        apiKey ==
        "4058094876094570khk5j4h6k54hk-0vd-x0-sd9f-0sdljsldjfo=joijsdfo"
    ) {
        next();
    } else {
        res.json({
            message: "Cannot Access This Feature",
        });
    }
};

app.get("/health-check", ChackApikey, (req, res) => {
    res.status(200).json({
        stutas: "UP",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        loadavg: os.loadavg(),
        cpuCount: os.cpus().length,
        platform: os.platform(),
        nodeVersion: process.version,
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
