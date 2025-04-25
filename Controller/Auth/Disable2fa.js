const Userconfig = require("../../model/UserConfig");
const { authenticator } = require("otplib");


const Disable2fa = async (req, res) => {
    const { code } = req.body;

    try {
        const userconfig = await Userconfig.findOne({
            username: req.username,
        });

        if (!userconfig.TwoFa_App_Token) {
            return res
                .status(404)
                .json({ message: "User configuration not found." });
        }

        const isValid = authenticator.verify({
            token: code,
            secret: userconfig.TwoFa_App_Token,
        });

        if (isValid) {
            await Userconfig.updateOne(
                { username: req.username },
                {
                    $unset: {
                        TwoFa_App_Token: 1,
                    },
                }
            );
            return res.status(200).json({
                message: "App authenticator disabled successfully.",
            });
        } else {
            return res.status(400).json({ message: "Invalid TwoFactor code." });
        }
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                "An error occurred while disabling Two-Factor Authentication.",
        });
    }
};
module.exports = Disable2fa;
