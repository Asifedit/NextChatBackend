const jwt = require("jsonwebtoken");
const User = require("../model/user_model");
const Option = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};
const Verify = async (req, res, next) => {
    const Token = req.cookies.AccessToken || req.headers.accesstoken;
    
    if (!Token) {
        return res
            .status(401)
            .json({ message: "we need login fast", RedirectTo: "/login" });
    }
    try {
        const user = jwt.verify(Token, process.env.jwt_AcessToken_Secret);
        req.username = user.username;
        next();
    } catch (error) {
        console.error("error name is ", error.name);
        if (error.name === "TokenExpiredError") {
            try {
                const RefresToken =
                    req.cookies.RefreshToken || req.headers.refreshtoken;
                const GetPaload = jwt.verify(
                    RefresToken,
                    process.env.jwt_RefreshToken_Secret
                );
                const getUser = await User.findOne({
                    username: GetPaload.username,
                }).select(["refToken"]);
                if (RefresToken !== getUser.refToken) {
                    return res.status(401).json({
                        message: "Your Login expair plese login again",
                        RedirectTo: "/login",
                    });
                }
                const NewAccessToken = jwt.sign(
                    {
                        username: GetPaload.username,
                    },
                    process.env.jwt_AcessToken_Secret,
                    { expiresIn: process.env.jwt_AcessToken_Expair }
                );
                const NewRefresToken = jwt.sign(
                    {
                        username: GetPaload.username,
                    },
                    process.env.jwt_RefreshToken_Secret
                );
                getUser.refToken = NewRefresToken;
                await getUser.save();
                return res.status(200)
                    .json({
                        cookie: {
                            AccessToken: NewAccessToken,
                            RefreshToken: NewRefresToken,
                        },
                    });
                req.username = GetPaload.username;
                return next();
            } catch (error) {
                console.error("Verify Error From RsfresToken", error);
                res.status(400).json({ message: "Somthing Wrong login again" });
            }
        } else if (
            error.name === "SyntaxError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res
                .status(400)
                .json({ message: "Somthing Wrong login again" });
        } else {
            return res
                .status(400)
                .json({ message: "Sendomthing worng plese try leter" });
        }
    }
};
module.exports = { Verify };
