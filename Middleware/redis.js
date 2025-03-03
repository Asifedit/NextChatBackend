const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
    console.log(
        "Connected  Redis As:",
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

const Deletvalue = async (key) => {
    try {
        const response = await redis.del(key);
        return response;
    } catch (error) {
        console.error("Error deleting value in Redis:", error);
        throw new Error("Failed to delete value in Redis");
    }
};

const Incriment = async (key) => {
    try {
        const response = await redis.incr(key);
        return response;
    } catch (error) {
        console.error("Error Incriment value in Redis:", error);
    }
};

const rateLimitation = async (bucketName, limit, expiration) => {
    const key = `bucket:${bucketName}`;

    try {
        const exists = await redis.exists(key);

        if (!exists) {
            await redis.set(key, limit, "EX", expiration);
            return { R: "N", remaining: limit };
        }
        const remaining = await redis.multi().decr(key).get(key).exec();
        if (remaining && remaining[0][1] >= Math.floor(limit * 0.7)) {
            return { R: "N", remaining: remaining[0][1] };
        } else if (remaining && remaining[0][1] >= Math.floor(limit * 0.5)) {
            return { R: "M", remaining: remaining[0][1] };
        } else if (remaining && remaining[0][1] >= Math.floor(limit * 0.2)) {
            return { R: "H", remaining: remaining[0][1] };
        } else {
            await redis.set(key, 0);
            return { R: "VH", remaining: remaining[0][1] };
        }
    } catch (error) {
        console.error("Redis error:", error);
        return { R: " VH", remaining: limit };
    }
};

module.exports = {
    redis,
    GrtValue,
    SetValue,
    Deletvalue,
    rateLimitation,
    Incriment,
};
