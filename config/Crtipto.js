const crypto = require("crypto");

function decryptData(req, res, next) {
    const { encryptedData, iv, authTag, encryptedAESKey } = req.body;
    // console.log(req.body);
    if (!encryptedData) {
        next();
    }
    try {
        const privateKeyPem = process.env.PRIVATE_KEY;
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        const AES_SECRET_KEY = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(encryptedAESKey, "base64")
        );

        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            AES_SECRET_KEY,
            Buffer.from(iv, "base64")
        );
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        let decrypted = decipher.update(
            Buffer.from(encryptedData, "base64"),
            "binary",
            "utf-8"
        );
        decrypted += decipher.final("utf-8");
        req.body = JSON.parse(decrypted);
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({ messages: "require value not found" });
    }
}

function DecryptData(encryptedPayload) {
    const { encryptedData, iv, authTag, encryptedAESKey } = encryptedPayload;
    try {
        const privateKeyPem = process.env.PRIVATE_KEY;
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        const AES_SECRET_KEY = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(encryptedAESKey, "base64")
        );

        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            AES_SECRET_KEY,
            Buffer.from(iv, "base64")
        );
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        let decrypted = decipher.update(
            Buffer.from(encryptedData, "base64"),
            "binary",
            "utf-8"
        );
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.log(error);
    }
}
module.exports = {
    decryptData,
    DecryptData,
};
