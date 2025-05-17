
const QRCode = require("qrcode");
const { authenticator } = require("otplib");
const {SetValue} = require("../../Redis/redis");

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

module.exports = SetUp2fa;
