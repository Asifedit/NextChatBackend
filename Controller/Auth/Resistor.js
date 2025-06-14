const User = require("../../model/user_model");
const jwt = require("jsonwebtoken");
const verifyEmail = require("../../utils/ValidetEmail");
const SenEmail = require("../../utils/Nodemaler");
const { SetValue } = require("../../Redis/redis");
const CreateToken = require("./CreateToken");

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

    const chackemail = await verifyEmail(email);

    if (!chackemail.valid) {
        return res.status(400).json({ message: chackemail.message });
    }

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const OTP = await CreateToken();

        const mailResponce = await SenEmail("verification", email, {
            name: username,
            verificationCode: OTP,
        });
        if (!mailResponce.success) {
            return res.status(200).json({ messages: "error to send code" });
        }

        await SetValue(`Verification:OTP:${username}`, OTP, 60 * 60 * 5);

        const VerificationToken = jwt.sign(
            { username, password, email, token: OTP },
            process.env.jwt_VerificationToken,
            { expiresIn: process.env.jwt_VerificationToken_Expair }
        );

        return res.status(201).json({
            message: "User created successfully",
            cookie: {
                VerificationToken: VerificationToken,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fail to Resistor" });
    }
};

const ReSendEmail = async (req, res) => {
    try {
        const VerificationToken =
            req.cookies.VerificationToken || req.headers.verificationtoken;

        if (!VerificationToken)
            return res
                .status(401)
                .json({ messages: "Somthing Wrong  Resistor Again" });

        const verifi = jwt.verify(
            VerificationToken,
            process.env.jwt_VerificationToken
        );

        if (!verifi) {
            return res.status(400).json({ message: "Invalid Token" });
        }
        const { username, email } = verifi;
        if (!username || !email) {
            return res
                .status(400)
                .json({ message: "Error TO Resend Otp Plse again resistor" });
        }

        const OTP = await CreateToken();
        console.log(OTP);
        const mailResponce = await SenEmail("verification", email, {
            name: username,
            verificationCode: OTP,
        });
        if (!mailResponce.success) {
            return res.status(200).json({ messages: "error to send code" });
        }
        await SetValue(`Verification:OTP:${username}`, OTP, 60 * 60 * 5);
        res.status(200).json("sucessfull");
    } catch (error) {
        return res.status(500).json({ message: "Fail to Resend Otp" });
    }
};
module.exports = { Resistor, ReSendEmail };
