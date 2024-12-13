const User = require("../model/user_model");
const Userconfig = require("../model/UserConfig");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
let UserTempDb = {};

const Option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    UserTempDb[req.username] = secret;
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
    const { code } = req.body;
    const userSecret = UserTempDb[req.username];
    if (!userSecret) {
        return res.status(400).send("User not found");
    }
    const isValid = authenticator.verify({
        token: code,
        secret: userSecret,
    });
    if (isValid) {
        const userconfig = await Userconfig.findOneAndUpdate(
            { userName: req.username },
            {
                $setOnInsert: {
                    userName: req.username,
                    TwoFaAppToken: userSecret,
                },
            },
            { upsert: true }
        );
        res.json({ success: true });
    } else {
        res.status(400).send("Invalid code");
    }
};

const verifiCoad = (req, res) => {};

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

            // Check if the operation was acknowledged
            if (UserConfiguration.acknowledged) {
                return res
                    .status(200)
                    .json({ message: "PIN successfully disabled." });
            }

            // If update wasn't acknowledged, return an error
            return res
                .status(400)
                .json({ message: "Failed to disable PIN. Please try again." });
        } catch (error) {
            // Handle any unexpected errors
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
           

            if (UserConfigration.Two_Step_Verification_Coad) {
                return res.status(400).json({ message: "Somthing Weong : We cannot undastand" });
            }
            const newUserConfigration = new Userconfig({
                Two_Step_Verification_Coad: pin,
            });
            
          await  newUserConfigration.save()

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