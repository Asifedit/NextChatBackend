const User = require("../../model/user_model");
const Userconfig = require("../../model/UserConfig");
const jwt = require("jsonwebtoken");
const {
    SetValue,
    GrtValue,
    rateLimitation,
} = require("../../Middleware/redis");

const Option = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};

const Login = async (req, res) => {
    const { username, password } = req.body || req.headers;
    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Please provide both username and password" });
        }
        const ISCooldwone = JSON.parse(
            await GrtValue(`LOGIN:FAILDED:TIME:${username}`)
        );

        if (ISCooldwone) {
            const CooldwoneTime = Math.floor(
                (new Date() - new Date(ISCooldwone.TIME)) / 1000
            );
            if (!(CooldwoneTime >= ISCooldwone.delay)) {
                return res.status(429).json({
                    message: `Wait more ${ISCooldwone.delay - CooldwoneTime}`,
                    delay: ISCooldwone.delay - CooldwoneTime,
                });
            }
        }

        const user = await User.findOne({ username }).select("password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await SetValue(`P:U:${username}`, user.password, 60 * 60 * 1);
        const isMatch = await user.isPasswordVerified(password);
        if (!isMatch) {
            const responce = await rateLimitation(
                `LOGIN:FAILDED:${username}`,
                10,
                60 * 60 * 10
            );
            if (responce.R == "N") {
                return res.status(400).json({ message: "Incorrect password" });
            }

            if (responce.R == "M") {
                await SetValue(
                    `LOGIN:FAILDED:TIME:${username}`,
                    JSON.stringify({
                        TIME: new Date().toISOString(),
                        delay: 1 * 10,
                    }),
                    60 * 60 * 10
                );
                return res
                    .status(429)
                    .json({ message: "Incorrect password", delay: 1 * 60 });
            }
            if (responce.R == "H") {
                await SetValue(
                    `LOGIN:FAILDED:TIME:${username}`,
                    JSON.stringify({
                        TIME: new Date().toISOString(),
                        delay: 3 * 60,
                    }),
                    60 * 60 * 10
                );
                return res
                    .status(429)
                    .json({ message: "Incorrect password", delay: 3 * 60 });
            }
            if (responce.R == "VH") {
                await SetValue(
                    `LOGIN:FAILDED:TIME:${username}`,
                    JSON.stringify({
                        TIME: new Date().toISOString(),
                        delay: 5 * 60,
                    }),
                    60 * 60 * 10
                );
                return res
                    .status(429)
                    .json({ message: "Incorrect password", delay: 5 * 60 });
            }
        }
        const ChackTwoFaStutas = await Userconfig.findOne({
            username: username,
        });
        if (ChackTwoFaStutas) {
            if (ChackTwoFaStutas?.TwoFa_App_Token) {
                const Lc = jwt.sign({ username }, process.env.jwt_LC_Token, {
                    expiresIn: process.env.jwt_LC_Token_Expaire,
                });
                return res.status(200).cookie("LcToken", Lc, Option).json({
                    message: "Next Stap Verifi",
                    RediractOn: "TwoFaAppVerification",
                });
            }
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
            .cookie("AccessToken", accessToken, Option)
            .cookie("RefreshToken", refreshToken, Option)
            .json({ message: "User logged in successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = Login;
