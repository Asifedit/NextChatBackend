const fetch = require("node-fetch"); // Ensure node-fetch is installed for server-side requests
require("dotenv").config();
// Function to verify email
async function verifyEmail(email) {
    try {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            return { valid: false, message: "Invalid email format." };
        }
        const response = await fetch(
            `https://api.emailable.com/v1/verify?email=${email}&api_key=${process.env.Email_Api_Key}`,
            { method: "GET" }
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch data from the Emailable API. Status: ${response.status}`
            );
        }
        const data = await response.json();
        const emailStatus = {
            valid: false,
            message: "",
        };
        if (data.disposable) {
            emailStatus.message = "Disposable email addresses are not allowed.";
            return emailStatus;
        }
        if (data.state !== "deliverable") {
            emailStatus.message = "Email is undeliverable or invalid.";
            return emailStatus;
        }
        if (data.reason !== "accepted_email") {
            emailStatus.message = "Email is not accepted or recognized.";
            return emailStatus;
        }
        emailStatus.valid = true;
        emailStatus.message = "Email is valid and accepted.";
        return emailStatus;
    } catch (error) {
        console.error("Error verifying email:", error);
        return {
            valid: false,
            message: "An error occurred while verifying the email.",
        };
    }
}

// Export the function for use in other filesx
module.exports = verifyEmail;
