const User = require("../model/user_model");
const Userconfig = require("../model/UserConfig");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
const TempToken = require("../model/tempToken");
const verifyEmail = require("../utils/ValidetEmail");
const SenEmail = require("../utils/Nodemaler");
const { SetValue, GrtValue, Deletvalue } = require("../Middleware/redis");

const Option = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
};

function CreateToken(length = 6) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }
    return token;
}

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
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const VerifiResistor = async (req, res) => {
    const { code } = req.body;
    const VerificationToken =
        req.cookies.VerificationToken || req.body.VerificationToken;

    if (!VerificationToken)
        return res
            .status(300)
            .json({ messages: "Somthing Wrong  Resistor Again" });

    const verifi = jwt.verify(
        VerificationToken,
        process.env.jwt_VerificationToken
    );

    if (!verifi) {
        return res.status(400).json({ message: "Invalid Token" });
    }
    const { username, password, email, token } = verifi;

    const DbCode = await GrtValue(`Verification:OTP:${username}`);
    if (DbCode != code) {
        return res.status(400).json({ message: "Code Not Match" });
    }
    await Deletvalue(`Verification:OTP:${username}`);

    if (!username || !password || !email || !token) {
        return res.status(404).json({ message: "Modification Not Allow !" });
    }
    const userTOKEN = await TempToken.findOne({
        username,
        token,
    });
    if (!userTOKEN)
        return res.status(400).json({ messages: "token not found" });
    if (userTOKEN.token != token) {
        return res.status(400).json({ message: "token not matching" });
    }
    const refreshToken = jwt.sign(
        { username },
        process.env.jwt_RefreshToken_Secret,
        { expiresIn: process.env.jwt_RefreshToken_Expair }
    );
    const accessToken = jwt.sign(
        { username },
        process.env.jwt_AcessToken_Secret,
        { expiresIn: process.env.jwt_AcessToken_Expair }
    );

    try {
        const newUser = new User({
            username,
            password,
            email: email,
            refToken: refreshToken,
        });

        await newUser.save();

        return res
            .status(200)
            .clearCookie("VerificationToken")
            .cookie("AccessToken", accessToken, Option)
            .cookie("RefreshToken", refreshToken, Option)
            .json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);

        res.status(400).json({ message: "Error to Resistor" });
    }
};

const Login = async (req, res) => {
    const { username, password } = req.body || req.headers;
    console.log(password);

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
            .json({
                message: "User logged in successfully",
                accessToken,
                refreshToken,
            });
        
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
    SetValue(`${req.username}:2fa:secret`, secret, 60 * 60 * 5);
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
        console.log(userconfig);

        const isValid = authenticator.verify({
            token: code,
            secret: userconfig.TwoFa_App_Token,
        });
        console.log(isValid);

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

const PinOpration = async (req, res) => {
    const { pin, OldPIN, Type } = req.body;
    if (!pin) {
        return res.status(400).json({ message: "PIN is Require" });
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
            console.error(error);
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
            console.error(error);
            res.status(500).json({ message: "Somthing Weong" });
        }
    }
};

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

const Verifi2faToken = async (req, res) => {
    const { code } = req.body;
    const Lctoken = req.cookies.LcToken;
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
            .clearCookie("LcToken")
            .cookie("AccessToken", accessToken, Option)
            .cookie("RefreshToken", refreshToken, Option)
            .json({ message: "User logged in successfully" });
    } catch (error) {
        res.status(500).json({ message: "error during process" });
        console.log(error);
    }
};

module.exports = {
    VerifiResistor,
    Login,
    Resistor,
    logout,
    SetUp2fa,
    Verifi2fa,
    PinOpration,
    Verifi2faToken,
    Disable2fa,
    DisablePin,
};
 