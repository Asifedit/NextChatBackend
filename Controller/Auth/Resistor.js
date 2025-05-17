const User = require("../../model/user_model");
const jwt = require("jsonwebtoken");
const verifyEmail = require("../../utils/ValidetEmail");
const SenEmail = require("../../utils/Nodemaler");
const { SetValue } = require("../../Redis/redis");
const CreateToken = require("./CreateToken");
const Option = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
};

const Resistor = async (req, res) => {
    const { username, password, email } = req.body || req.headers;

    if (!username || !password || !email) {
        return res
            .status(400)
            .json({ message: "Please provide all required fields" });
    }

    const usernameREGEX = /^[A-Za-z]+.+\d+.*$/;
    const emailREGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const PasswordREGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;

    if (!usernameREGEX.test(username)) {
        return res.status(400).json({
            message:
                "Username must start with letters and contain at-least one number",
        });
    }
    if (!emailREGEX.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
    }

    if (!PasswordREGEX.test(password)) {
        return res.status(400).json({
            message:
                "Password must contain uppercase , lowercase ,number, special character, and be at least 8 characters long.",
        });
    }

    // const chackemail = await verifyEmail(email);

    // if (!chackemail.valid) {
    //     return res.status(400).json({ message: chackemail.message });
    // }

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const OTP = await CreateToken();
        await SetValue(`Verification:OTP:${username}`, OTP, 60 * 60 * 5);

        const mailResponce = await SenEmail("verification", email, {
            name: username,
            verificationCode: OTP,
        });
        if (!mailResponce.success) {
            return res.status(200).json({ messages: "error to send code" });
        }

        const VerificationToken = jwt.sign(
            { username, password, email, token: OTP },
            process.env.jwt_VerificationToken,
            { expiresIn: process.env.jwt_VerificationToken_Expair }
        );

        return res
            .status(201)
            .cookie("VerificationToken", VerificationToken, Option)
            .json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fail to Resistor" });
    }
};

module.exports = Resistor;
