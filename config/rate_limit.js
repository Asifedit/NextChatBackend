const { redis } = require("../Redis/redis");
const rateLimiter = async (req, res, next) => {
    const username = req.username;
    const ip = req.ip.toString().replace(":","");
    const route = req.path.toString();
   const bucketKey = `rate_limit:${username}:${ip}:${route}`;
    const hourlyKey = `rate_limit_hourly:${username}:${ip}:${route}`;

    try {
        const exists = await redis.exists(bucketKey);
        if (!exists) await redis.set(bucketKey, 10, "EX", 60);

        const remaining = await redis.decr(bucketKey);
        if (remaining >= 0) {
            res.set("X-RateLimit-Remaining", remaining);
            return next();
        }

        const hourlyCount = await redis.incr(hourlyKey);
        if (hourlyCount === 1) await redis.expire(hourlyKey, 3600);

        if (hourlyCount > 100) {
            return res
                .status(429)
                .json({
                    message: "Too many requests. Please try again later.",
                });
        }

        res.set("X-RateLimit-Remaining", 0);
        res.status(429).json({ message: "Too many requests. Slowing down..." });
    } catch (error) {
        console.error("Redis error:", error);
        next();
    }
};

module.exports = rateLimiter;