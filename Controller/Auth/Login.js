const User = require("../../model/user_model");
const Userconfig = require("../../model/UserConfig");
const jwt = require("jsonwebtoken");
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const login = async (req, res) => {
    const { username, password, recaptchaToken } = req.body || req.headers;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                message: "Please provide both username and password",
            });
        }

        // Find user
        const user = await User.findOne({ username }).select("+password");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Invalid username or password" });
        }

        // Verify password
        const isMatch = await user.isPasswordVerified(password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Invalid username or password" });
        }

        // Check if 2FA is enabled
        const userConfig = await Userconfig.findOne({ username });
        if (userConfig?.TwoFa_App_Token) {
            const loginConfirmationToken = jwt.sign(
                { username },
                process.env.jwt_LC_Token,
                { expiresIn: process.env.jwt_LC_Token_Expaire }
            );

            return res
                .status(200)
                .cookie("LcToken", loginConfirmationToken, cookieOptions)
                .json({
                    message: "Two-factor authentication required",
                    redirectTo: "TwoFaAppVerification",
                });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { username },
            process.env.jwt_AcessToken_Secret,
            { expiresIn: process.env.jwt_AcessToken_Expair }
        );

        const refreshToken = jwt.sign(
            { username },
            process.env.jwt_RefreshToken_Secret,
            { expiresIn: process.env.jwt_RefreshToken_Expair }
        );

        // Save refresh token
        user.refToken = refreshToken;
        await user.save();

        // Return success response with tokens
        return res
            .status(200)
            .cookie("AccessToken", accessToken, cookieOptions)
            .cookie("RefreshToken", refreshToken, cookieOptions)
            .json({ message: "User logged in successfully" });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "An error occurred during login",
        });
    }
};

module.exports = login;
