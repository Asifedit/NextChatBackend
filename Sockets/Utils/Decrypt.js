const crypto = require("crypto");

const ENCRYPTION_KEY = Buffer.from("0123456789abcdef0123456789abcdef"); 

function decryptData({ iv, data }) {
    const ivBuffer = Buffer.from(iv);
    const dataBuffer = Buffer.from(data);

    const authTag = dataBuffer.slice(-16);
    const encrypted = dataBuffer.slice(0, -16);

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        ENCRYPTION_KEY,
        ivBuffer
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
}

module.exports = { decryptData };
