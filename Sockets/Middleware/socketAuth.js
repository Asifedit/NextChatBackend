const jwt = require("jsonwebtoken");
const VerifyAuth = (socket, next) => {
    try {
        const token = socket.request.headers.cookie
            ?.split("; ")
            .find((c) => c.startsWith("AccessToken="))
            ?.split("=")[1];

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        socket.username = jwt.verify(
            token,
            process.env.jwt_AcessToken_Secret
        ).username;

        next();
    } catch (error) {
        console.error(error);
    }
};
module.exports = VerifyAuth;