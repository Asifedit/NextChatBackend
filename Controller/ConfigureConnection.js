const crypto = require("crypto");
const ConfigConnection = (req, res) => {
    const Secretkey = crypto.randomBytes(32).toString("hex");
    // console.log(req);
    res.status(400).json({ message: "done" });
};
module.exports = ConfigConnection;
