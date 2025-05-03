const Redis = require("ioredis");
const redis = new Redis();

/**
 * Check if an account is rate-limited.
 * @param {string} accountId - User ID, email, or username.
 * @returns {object} { isLimited: boolean, retryAfter: number (seconds) }
 */
async function checkAccountRateLimit(accountId) {
    const ATTEMPTS_LIMIT = 5; // Max allowed attempts
    const WINDOW_SECONDS = 15 * 60; // 15-minute window
    const LOCK_DURATION = 30 * 60; // 30-minute lock if exceeded

    const attemptsKey = `attempts:account:${accountId}`;
    const lockKey = `lock:account:${accountId}`;

    // 1. Check if account is temporarily locked
    const lockedUntil = await redis.get(lockKey);
    if (lockedUntil) {
        const remainingLockTime = Math.ceil(
            (parseInt(lockedUntil) - Date.now()) / 1000
        );
        return { isLimited: true, retryAfter: remainingLockTime };
    }

    // 2. Remove expired attempts (older than WINDOW_SECONDS)
    const oldestAllowed = Date.now() - WINDOW_SECONDS * 1000;
    await redis.zremrangebyscore(attemptsKey, "-inf", oldestAllowed);

    // 3. Count remaining attempts
    const currentAttempts = await redis.zcard(attemptsKey);

    // 4. If attempts exceed limit, lock the account
    if (currentAttempts >= ATTEMPTS_LIMIT) {
        await redis.setex(
            lockKey,
            LOCK_DURATION,
            Date.now() + LOCK_DURATION * 1000
        );
        return { isLimited: true, retryAfter: LOCK_DURATION };
    }

    return { isLimited: false, retryAfter: 0 };
}

/**
 * Record a failed attempt for an account.
 * @param {string} accountId - User ID, email, or username.
 */
async function recordFailedAttempt(accountId) {
    const attemptsKey = `attempts:account:${accountId}`;
    await redis.zadd(attemptsKey, Date.now(), Date.now());
    await redis.expire(attemptsKey, 15 * 60); // Auto-expire in 15 minutes
}
