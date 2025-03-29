const Userconfig = require("../../model/UserConfig");
const { authenticator } = require("otplib");

const {
    GrtValue,
} = require("../../Middleware/redis");



const Verifi2fa = async (req, res) => {
    const { code, OprationType } = req.body;
    const userSecret = await GrtValue(`${req.username}:2fa:secret`);
    console.log(req.username);

    try {
        if (!userSecret) {
            return res
                .status(400)
                .json({ message: "User secret not found. Please try again." });
        }
        const isValid = authenticator.verify({
            token: code,
            secret: userSecret,
        });
        if (!isValid) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid TwoFactor code." });
        }

        const userconfig = await Userconfig.findOne({ username: req.username });
        if (userconfig) {
            if (!userconfig.TwoFa_App_Token) {
                userconfig.TwoFa_App_Token = userSecret;
                await userconfig.save();
            } else {
                userconfig.TwoFa_App_Token = userSecret;
                await userconfig.save();
            }
        } else {
            const UserConfigration = new Userconfig({
                username: req.username,
                TwoFa_App_Token: userSecret,
            });
            await UserConfigration.save();
        }
        return res.status(200).json({
            success: true,
            message: "TwoFactor code verified successfully.",
        });
    } catch (error) {
        console.error(
            `Error verifying TwoFactor code for user: ${req.username}`,
            error
        );
        return res.status(500).json({
            success: false,
            message: "An error occurred. Please try again later.",
        });
    }
};
module.exports = Verifi2fa;
