const jwt = require("jsonwebtoken");
const VerifyAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth.AccessToken;
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
