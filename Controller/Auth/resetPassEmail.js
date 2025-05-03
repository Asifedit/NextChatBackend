const Usermodel = require("../../model/user_model");
const { GrtValue, SetValue, Incriment } = require("../../Middleware/redis");
const crypto = require("crypto");
const SenEmail = require("../../utils/Nodemaler");
const bcrypt = require("bcrypt");
const ResetpassEmail = async (req, res) => {
    const { email, username } = req.body;
    try {
        const request = await GrtValue(`Reset:emailLimit:${username}`);
        // !ANCHOR -  fix it
        console.log(request);
        const user = await Usermodel.findOne({ email, username }).select([
            "username",
            "email",
        ]);

        if (!user) {
            return res
                .status(400)
                .json({ message: "Unable to found your account" });
        }

        const code = crypto.randomBytes(5).toString("hex");

        await SetValue(`Reset:email:${username}`, code, 60 * 60);
        await SetValue(`Reset:emailLimit:${username}`, 0, 60 * 60 * 5);

        // const mailResponce = await SenEmail("ResetPassEmail", email, {
        //     name: username,
        //     verificationCode: code,
        // });

        // if (!mailResponce.success) {
        //     return res.status(200).json({ messages: "error to send OTP" });
        // }
        await Incriment(`Reset:emailLimit:${username}`);
        res.status(200).json({ message: "email sucessfully sended" });
    } catch (error) {
        console.log(`Error on reset Password ${(email, username)}`, error);
        res.status(500).json({
            message: "Server unable to process this requiest",
        });
    }
};
const VerifyAndUpdate = async (req, res) => {
    const { email, username, OTP, password } = req.body;

    if (!email || !username || !OTP || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const otp = await GrtValue(`Reset:email:${username}`);
    if (otp != OTP) {
        return res.status(400).json({ message: "Incorrect Code ." });
    }
    const user = await Usermodel.findOne({ username, email }).select([
        "_id",
        "password",
    ]);
    if (!user) {
        return res
            .status(400)
            .json({ message: "Unable to found your account" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
        return res.status(400).json({
            message: "This password is already in use. Please choose another.",
        });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
        message: "Password updated successfully.",
    });
};

module.exports = { ResetpassEmail, VerifyAndUpdate };
