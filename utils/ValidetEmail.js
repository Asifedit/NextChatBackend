const axios = require("axios");
const { redis } = require("../Redis/redis");
require("dotenv").config();

const formatKey = (email) => `verified_email:${email.toLowerCase()}`;

async function verifyEmail(email) {
    const GENERIC_ERROR_MSG =
        "Unable to verify email at this time. Please try again later.";
    const FALLBACK_ALLOW_MSG =
        "Verification service is temporarily unavailable. Email tentatively accepted.";

    try {
        // Email format validation
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            return {
                valid: false,
                message: "Please enter a valid email address.",
            };
        }

        const redisKey = formatKey(email);

        // Check Redis cache
        try {
            const cached = await redis.get(redisKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.warn("[Redis] Cache lookup failed:", err.message);
        }

        // Primary: Emailable
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);

            const { data } = await axios.get(
                "https://api.emailable.com/v1/verify",
                {
                    params: {
                        email,
                        api_key: process.env.Email_Api_Key,
                    },
                    timeout: 2000,
                    signal: controller.signal,
                }
            );
            clearTimeout(timeout);

            const result = analyzeEmailable(data);
            await redis.setEx(
                redisKey,
                30 * 24 * 60 * 60,
                JSON.stringify(result)
            );
            return result;
        } catch (error) {
            console.warn("[Emailable] Primary check failed:", error.message);
        }

        // Fallback: Apilayer
        try {
            const { data } = await axios.get("https://apilayer.net/api/check", {
                params: {
                    access_key: process.env.Apilayer_Api_Key,
                    email,
                },
                timeout: 2000,
            });

            const result = analyzeApilayer(data);
            await redis.setEx(
                redisKey,
                30 * 24 * 60 * 60,
                JSON.stringify(result)
            );
            return result;
        } catch (fallbackError) {
            console.error("[Apilayer] Fallback failed:", fallbackError);
            return { valid: true, message: FALLBACK_ALLOW_MSG };
        }
    } catch (finalError) {
        console.error("[System] Unexpected error:", finalError.message);
        return { valid: true, message: FALLBACK_ALLOW_MSG };
    }
}

// Analyze Emailable API response
function analyzeEmailable(data) {
    if (data.disposable) {
        return {
            valid: false,
            message: "Temporary email addresses are not allowed.",
        };
    }

    if (data.role || data.risky) {
        return {
            valid: false,
            message:
                "Email address appears to be used by bots or shared roles.",
        };
    }

    if (data.state === "deliverable") {
        return { valid: true, message: "Email address looks good." };
    }

    return { valid: false, message: "Unable to verify this email address." };
}

// Analyze Apilayer API response
function analyzeApilayer(data) {
    if (!data.format_valid || !data.mx_found) {
        return {
            valid: false,
            message: "Email format or domain appears invalid.",
        };
    }

    if (data.disposable) {
        return {
            valid: false,
            message: "Temporary email addresses are not allowed.",
        };
    }

    if (data.role) {
        return {
            valid: false,
            message: "Email appears to be a generic role-based address.",
        };
    }

    if (data.smtp_check && data.score >= 0.5) {
        return { valid: true, message: "Email address looks good." };
    }

    return { valid: false, message: "Unable to verify this email address." };
}

module.exports = verifyEmail;
