const crypto = require("crypto");
const { redis } = require("../Middleware/redis");

const setup = async (req, res) => {
    const Token = crypto.randomBytes(20).toString("hex");
    await redis.hset(`Detailes:${req.username}`, "SKey", Token);
    res.status(200).json(Token);
};

module.exports = setup;
