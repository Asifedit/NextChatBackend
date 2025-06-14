const User = require("../../model/user_model");
const jwt = require("jsonwebtoken");
const { GrtValue, Deletvalue } = require("../../Redis/redis");

const VerifiResistor = async (req, res) => {
    const { code } = req.body;
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
    const { username, password, email, token } = verifi;

    const DbCode = await GrtValue(`Verification:OTP:${username}`);
    if (DbCode != code) {
        return res.status(400).json({ message: "Code Not Match" });
    }
    await Deletvalue(`Verification:OTP:${username}`);

    if (!username || !password || !email || !token) {
        return res.status(404).json({ message: "Modification Not Allow !" });
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
            .json({
                message: "User created successfully",
                cookie: {
                    AccessToken: accessToken,
                    RefreshToken: refreshToken,
                },
            });
    } catch (error) {
        console.error(error);

        res.status(400).json({ message: "Error to Resistor" });
    }
};

module.exports = VerifiResistor;