const jwt = require("jsonwebtoken");
const User = require("../model/user_model");
const Option = {
    httpOnly: true,
    secure: true,
};
const Verify = async (req, res, next) => {
    const Token = req.cookies.AccessToken;
    console.log(req.cookies);
    
    if (!Token) {
        return res
            .status(302)
            .json({ message: "we need login fast", RedirectTo: "/login" });
    }
    try {
        const user = jwt.verify(Token, process.env.jwt_AcessToken_Secret);
        req.username = user.username;
        next();
    } catch (error) {
        console.log("error name is ", error.name);
        if (error.name === "TokenExpiredError") {
            try {
                const RefresToken = req.cookies.RefreshToken;
                const GetPaload = jwt.verify(
                    RefresToken,
                    process.env.jwt_RefreshToken_Secret
                );
                const getUser = await User.findOne({
                    username: GetPaload.username,
                }).select(["refToken"]);
                if (RefresToken !== getUser.refToken) {
                    return res
                        .status(300)
                        .json({ message: "Your login expair " });
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
                res.status(200)
                    .cookie("AccessToken", NewAccessToken, Option)
                    .cookie("RefreshToken", NewRefresToken, Option);
                req.username = GetPaload.username;
                return next();
            } catch (error) {
                console.log("Verify Error From RsfresToken", error);
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
 