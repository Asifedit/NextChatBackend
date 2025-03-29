const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");
const User = require("../../model/user_model");
const Userconfig = require("../../model/UserConfig");

const DisablePin = async (req, res) => {
    const { pin } = req.body;
    if (!pin) {
        return res.status(400).json({ message: "PIN is Require" });
    }

    try {
        const userConfig = await Userconfig.findOne({
            username: req.username,
        });
        if (!userConfig || !userConfig.Two_Step_Verification_Coad) {
            return res.status(404).json({
                message: "PIN is not enabled or already disabled.",
            });
        }
        if (pin != userConfig.Two_Step_Verification_Coad) {
            return res.status(400).json({ message: "PIN Not Match." });
        }
        const UserConfiguration = await Userconfig.updateOne(
            { username: req.username },
            { $unset: { Two_Step_Verification_Coad: "" } }
        );
        if (UserConfiguration.acknowledged) {
            return res
                .status(200)
                .json({ message: "PIN successfully disabled." });
        }
        return res.status(400).json({
            message: "Failed to disable PIN. Please try again.",
        });
    } catch (error) {
        console.error("Error disabling PIN:", error);
        return res.status(500).json({
            message: "An error occurred while disabling the PIN.",
        });
    }
};
module.exports = DisablePin