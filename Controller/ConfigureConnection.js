const crypto = require("crypto");
const jwt = require("jsonwebtoken")
const ConfigConnection = (req, res) => {
    const Secretkey = crypto.randomBytes(32).toString("hex");
    // console.log(req);
    const secret = req.username
    const jt = jwt.sign(secret, Secretkey);
    console.log(jt)

    
    res.status(200).json(Secretkey);
};
module.exports = ConfigConnection;
