const crypto = require("crypto");

const SECRET_KEY = "your-secret-password";

const encrypt = (text, password) => {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(password).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};

const Backupcode = async (req, res) => {
    try {
        const backupCodes = Array.from({ length: 3 }, () =>
            crypto.randomBytes(20).toString("hex")
        ).join("\n");

        const encryptedBackupCodes = encrypt(backupCodes, SECRET_KEY);

        res.status(200).json(encryptedBackupCodes);
    } catch (error) {
        console.error("Error generating backup code:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = Backupcode;
