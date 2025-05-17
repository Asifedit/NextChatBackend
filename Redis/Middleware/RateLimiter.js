const redis = require("../redis").redis;

const LoginRateLimiter = async (req, res, next) => {
    const LIMITS = {
        ip: { limit: 100, window: 3600 },
        user: { limit: 30, window: 300 },
        maxIPsPerUser: 10,
        maxUsersPerIP: 10,
    };

    try {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
        const username = req.body.username;
        if (!username) return res.status(400).send("Username is required");

        const userKey = `rl:user:${username}`;
        const ipKey = `rl:ip:${ip}`;
        const userIPsKey = `rl:user-ips:${username}`;
        const ipUsersKey = `rl:ip-users:${ip}`;

        const [userCount, ipCount] = await redis.mget(userKey, ipKey);

        if (+userCount >= LIMITS.user.limit) {
            return res.status(429).json({
                message:
                    "You tried too many times. Please wait a moment before trying again.",
                delay: LIMITS.user.window,
            });
        }

        if (+ipCount >= LIMITS.ip.limit) {
            return res.status(429).json({
                message:
                    "We’re getting too many requests right now. Please slow down and try again shortly.",
                delay: LIMITS.ip.window,
            });
        }

        const multi = redis
            .multi()
            .sadd(userIPsKey, ip)
            .expire(userIPsKey, LIMITS.user.window)
            .sadd(ipUsersKey, username)
            .expire(ipUsersKey, LIMITS.ip.window)
            .incr(userKey)
            .expire(userKey, LIMITS.user.window)
            .incr(ipKey)
            .expire(ipKey, LIMITS.ip.window);

        const [[, userIPsAdded], , [, ipUsersAdded]] = await multi.exec();

        if (userIPsAdded) {
            const count = await redis.scard(userIPsKey);
            if (count > LIMITS.maxIPsPerUser) {
                return res.status(429).json({
                    message:
                        "Your activity looks unusual. Let’s try again in a few minutes.",
                });
            }
        }

        if (ipUsersAdded) {
            const count = await redis.scard(ipUsersKey);
            if (count > LIMITS.maxUsersPerIP) {
                return res.status(429).json({
                    message:
                        "We’re experiencing unusual activity. Please wait a bit before trying again.",
                });
            }
        }

        next();
    } catch (err) {
        console.error("Rate limiter failed:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }
};

const OtpRateLimiter = async (req, res, next) => {
    const LIMITS = 20;
    const { username } = req.body;
    if (!username) return res.status(400).send("Username is required");

    const userKey = `rl:otp:${username}`;
    const userCount = await redis.get(userKey);
    if (userCount >= LIMITS) {
        return res.status(429).json({
            message:
                "You have reached the maximum number of OTP requests. Please try again later.",
        });
    }
    const multi = redis
        .multi()
        .incr(userKey)
        .expire(userKey, 10 * 60);
    await multi.exec();
    next();
};

const RsendOtpLimiter = async (req, res, next) => {
    const MAX_REQUESTS = 20;
    const WINDOW_SECONDS = 10 * 60; // 10 minutes
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const key = `rl:otp:${email}`;
    const data = await redis.hgetall(key);

    const count = parseInt(data.count || "0");
    const lastTime = parseInt(data.lastTime || "0");
    const now = Date.now();

    // Determine current delay based on count
    let delay = 0;
    if (count >= (MAX_REQUESTS * 3) / 4) delay = 10 * 60;
    else if (count >= MAX_REQUESTS / 2) delay = 5 * 60;
    else if (count >= MAX_REQUESTS / 4) delay = 2 * 60;

    // Cooldown check: if not enough time has passed since last request
    const secondsSinceLast =
        lastTime > 0 ? Math.floor((now - lastTime) / 1000) : Infinity;
    if (delay > 0 && secondsSinceLast < delay) {
        return res.status(429).json({
            message: `Please wait ${
                delay - secondsSinceLast
            } seconds before retrying.`,
            retryAfter: delay - secondsSinceLast,
        });
    }

    // Check if max requests exceeded
    if (count >= MAX_REQUESTS) {
        return res.status(429).json({
            message:
                "You've made too many verification attempts. Please try again later.",
            retryAfter: WINDOW_SECONDS,
        });
    }

    // Record the new attempt
    await redis
        .multi()
        .hincrby(key, "count", 1)
        .hset(key, "lastTime", now)
        .expire(key, WINDOW_SECONDS)
        .exec();

    req.delay = delay;
    next();
};


const OldPassLimiter = async (req, res, next) => {
    const { username } = req.body;
    const MAX_REQUESTS = 50;
    const WINDOW_SECONDS = 30 * 60;

    const Key = `rl:OldPass:${username}`;
    const current = await redis.get(Key);
    const count = parseInt(current) || 0;

    if (count >= MAX_REQUESTS) {
        return res.status(429).json({
            message:
                "You've made too many  attempts. Please wait a while before trying again.",
            retryAfter: WINDOW_SECONDS,
        });
    }

    let delay = 0;
    const value = MAX_REQUESTS % 10;

    if (value > 4) delay = 10 * 60;
    else if (value > 3) delay = 5 * 60;
    else if (value > 3) delay = 2 * 60;
    else if (value > 1) delay = 60;
    else delay = 0;

    await redis.multi().incr(Key).expire(Key, WINDOW_SECONDS).exec();

    req.delay = delay;
    next();
};
module.exports = {
    LoginRateLimiter,
    OtpRateLimiter,
    RsendOtpLimiter,
    OldPassLimiter,
};
