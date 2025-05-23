const crypto = require("crypto");

function CreateToken(length = 6) {
    return crypto
        .randomBytes(length / 2)
        .toString("hex")
        .toUpperCase();
}

module.exports = CreateToken;