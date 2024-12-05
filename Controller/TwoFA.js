const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} = require("@simplewebauthn/server");

const users = {};

const authentication = async (req, res) => {
    const { username } = req.body; // Extract username from the request body
    try {
        const options = await generateRegistrationOptions({
            rpName: "Your App Name",
            rpID: "localhost",
            userName: username,
            userDisplayName: username,
        });
        res.json(options);
    } catch (error) {
        console.error("Error generating registration options:", error);
        res.status(500).json({
            error: "Failed to generate registration options",
        });
    }
};

const authenticationVerify = (req, res) => {
    const { username, response } = req.body;
    const expectedOptions = users[username].options;

    const verification = verifyRegistrationResponse({
        response,
        expectedOptions,
        // Here you need to provide the public key credential source, e.g., from a database
    });

    if (verification.verified) {
        // Store the credential ID and public key in your database
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Verification failed" });
    }
};
 
module.exports = { authenticationVerify, authentication };
