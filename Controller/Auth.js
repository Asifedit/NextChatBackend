const User = require("../model/user_model");
const Userconfig = require("../model/UserConfig");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
let UserTempDb = {};

const Option = {
    httpOnly: true, 
    secure: true, 
    sameSite: "None",
};

const Resistor = async (req, res) => {
    const { username, password, email } = req.body || req.headers;

    if (!username || !password || !email) {
        return res
            .status(400)
            .json({ message: "Please provide all required fields" });
    }

    try {
        const userExists = await User.findOne({ username });

        // If user already exists, return an error.
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const refreshToken = jwt.sign(
            { username },
            process.env.jwt_RefreshToken_Secret,
            { expiresIn: process.env.jwt_RefreshToken_Expair }
        );

        const newUser = new User({
            username,
            password,
            email: email,
            refToken: refreshToken,
        });

        await newUser.save();

        const accessToken = jwt.sign(
            { username, ID: newUser._id },
            process.env.jwt_AcessToken_Secret,
            { expiresIn: process.env.jwt_AcessToken_Expair }
        );

        return res
            .status(201) // Using 201 status code for resource creation
            .cookie("AccessToken", accessToken, Option)
            .cookie("RefreshToken", refreshToken, Option)
            .json({ message: "User created successfully", newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const Login = async (req, res) => {
    const { username, password } = req.body || req.headers;

    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Please provide both username and password" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await user.isPasswordVerified(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
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

const logout = (req, res) => {
    return res
        .status(200)
        .clearCookie("AccessToken", Option)
        .clearCookie("RefreshToken", Option)
        .json({ message: "User logged out successfully" });
};

const SetUp2fa = async (req, res) => {
    const secret = authenticator.generateSecret();
    UserTempDb[req.username.toString()] = secret;
    const otpauthUrl = `otpauth://totp/Asif:${req.username}?secret=${secret}&issuer=Asif1`;
    const qrOptions = {
        errorCorrectionLevel: "H",
        type: "png",
        quality: 0.92,
        margin: 4,
        color: {
            dark: "#0000ff",
            light: "#ffffff",
        },
    };
    QRCode.toDataURL(otpauthUrl, qrOptions, (err, dataUrl) => {
        if (err) {
            return res.status(500).send("Error generating QR code");
        }
        res.json({ qrCodeUrl: dataUrl, secret });
    });
};

const Verifi2fa = async (req, res) => {
    const { code, OprationType } = req.body;
    const userSecret = UserTempDb[req.username];
    if (OprationType === "Disable") {
        try {
            const userconfig = await Userconfig.findOne({
                username: req.username,
            });

            if (!userconfig) {
                return res
                    .status(404)
                    .json({ message: "User configuration not found." });
            }
            const isValid = authenticator.verify({
                token: code,
                secret: userconfig.TwoFa_App_Token,
            });
            if (isValid) {
                const daat = await Userconfig.updateOne(
                    { username: req.username },
                    {
                        $unset: {
                            TwoFa_App_Token: 1,
                        },
                    }
                );
                console.log(daat);
                return res.status(200).json({
                    message: "App authenticator disabled successfully.",
                });
            } else {
                return res
                    .status(400)
                    .json({ message: "Invalid TwoFactor code." });
            }
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message:
                    "An error occurred while disabling Two-Factor Authentication.",
            });
        }
    }
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

const PinOpration = async (req, res) => {
    const { pin, OldPIN, Type } = req.body;
    if (!pin) {
        return res.status(400).json({ message: "PIN is Require" });
    }
    if (Type == "Disable PIN") {
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
            return res
                .status(400)
                .json({ message: "Failed to disable PIN. Please try again." });
        } catch (error) {
            console.error("Error disabling PIN:", error);
            return res.status(500).json({
                message: "An error occurred while disabling the PIN.",
            });
        }
    }

    if (OldPIN) {
        if (!OldPIN) {
            return res.status(400).json({ message: "OldPIN is Require" });
        }
        try {
            const UserConfigration = await Userconfig.findOneAndReplace(
                {
                    username: req.username,
                    Two_Step_Verification_Coad: OldPIN,
                },
                {
                    Two_Step_Verification_Coad: pin,
                }
            );
            if (!UserConfigration) {
                return res.status(400).json({
                    message: "Cannot Conform Your Pin ",
                });
            }
            return res.status(200).json({
                message: "Sucessfully  Change Your Pin",
                Newpin: UserConfigration.UserSetPin,
            });
        } catch (error) {
            console.log(error);
            return res.status(200).json({ message: "Somthing Wrong" });
        }
    } else {
        try {
            const UserConfigration = await Userconfig.findOne({
                username: req.username,
            });
            if (UserConfigration) {
                if (UserConfigration?.Two_Step_Verification_Coad) {
                    return res.status(400).json({
                        message: "Somthing Weong : We cannot undastand",
                    });
                } else {
                    UserConfigration.Two_Step_Verification_Coad = pin;
                    await UserConfigration.save();
                }
            } else {
                const newUserConfigration = new Userconfig({
                    username: req.username,
                    Two_Step_Verification_Coad: pin,
                });
                await newUserConfigration.save();
            }
            res.status(200).json({ message: "sucesfullly created" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Somthing Weong" });
        }
    }
};

module.exports = {
    Login,
    Resistor,
    logout,
    SetUp2fa,
    Verifi2fa,
    PinOpration,
};