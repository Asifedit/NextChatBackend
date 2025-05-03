const {redis} = require("./redis");

const ACCOUNT_RATE_LIMIT = {
    ATTEMPTS: 5, // Max 5 attempts
    WINDOW: 15 * 60, // 15-minute window
    LOCK_DURATION: 30 * 60, // 30-minute lock
};

// Account-based rate limiter
async function accountRateLimiter(accountId) {
    const { ATTEMPTS, WINDOW, LOCK_DURATION } = ACCOUNT_RATE_LIMIT;
    const attemptsKey = `rate_limit:account:${accountId}`;
    const lockKey = `lock:account:${accountId}`;

    // Check if locked
    const lockedUntil = await redis.get(lockKey);
    if (lockedUntil) {
        const retryAfter = Math.ceil(
            (parseInt(lockedUntil) - Date.now()) / 1000
        );
        return { blocked: true, retryAfter };
    }

    // Clean old attempts and check count
    await redis.zremrangebyscore(
        attemptsKey,
        "-inf",
        Date.now() - WINDOW * 1000
    );
    const attempts = await redis.zcard(attemptsKey);

    if (attempts >= ATTEMPTS) {
        await redis.setex(
            lockKey,
            LOCK_DURATION,
            Date.now() + LOCK_DURATION * 1000
        );
        return { blocked: true, retryAfter: LOCK_DURATION };
    }

    return { blocked: false };
}

// Record a failed attempt
async function recordFailedAttempt(accountId) {
    await redis.zadd(`rate_limit:account:${accountId}`, Date.now(), Date.now());
    await redis.expire(
        `rate_limit:account:${accountId}`,
        ACCOUNT_RATE_LIMIT.WINDOW
    );
}

module.exports = {
    accountRateLimiter,
    recordFailedAttempt,
};
