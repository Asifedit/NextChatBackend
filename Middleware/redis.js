const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL,);

redis.on("connect", () => {
    console.log(
        "Connected to Upstash Redis As:",
        redis.options.role,
        ", On port :",
        redis.options.port
    );
});

redis.on("error", (error) => {
    console.error("Error connecting to Redis:", error.address, error.port);
});

const GrtValue = async (key) => {
    try {
        const value = await redis.get(key);
        return value;
    } catch (error) {
        console.error("Error getting value from Redis:", error);
        throw new Error("Failed to get value from Redis");
    }
};
const SetValue = async (key, value, expireSeconds = 60 * 60 * 12) => {
    try {
        const response = await redis.set(key, value, "EX", expireSeconds);
        return response;
    } catch (error) {
        console.error("Error setting value in Redis:", error);
        throw new Error("Failed to set value in Redis");
    }
};


module.exports = {redis, GrtValue, SetValue };
