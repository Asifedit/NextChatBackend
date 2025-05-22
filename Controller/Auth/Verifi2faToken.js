const User = require("../../model/user_model");
const Userconfig = require("../../model/UserConfig");
const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");

const Verifi2faToken = async (req, res) => {
    const { code } = req.body;
    const Lctoken = req.cookies.LcToken || req.headers.lctoken;
    if (!code) {
        return res.status(400).json({ message: "code is require" });
    }
    if (!Lctoken) {
        return res.status(400).json({ messages: "token not found" });
    }
    try {
        const username = jwt.verify(Lctoken, process.env.jwt_LC_Token).username;
        const configration = await Userconfig.findOne({
            username: username,
        });
        const isValid = authenticator.verify({
            token: code,
            secret: configration.TwoFa_App_Token,
        });
        if (!isValid) {
            return res.status(400).json({ message: "Code Not Match" });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
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
        user.refToken = refreshToken;
        await user.save();

        return res
            .status(200)
            .json({
                message: "User logged in successfully",
                cookie: {
                    AccessToken: accessToken,
                    RefreshToken: refreshToken,
                },
            });
    } catch (error) {
        res.status(500).json({ message: "error during process" });
        console.log(error);
    }
};

module.exports = Verifi2faToken;
