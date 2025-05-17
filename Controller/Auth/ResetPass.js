const Usermodel = require("../../model/user_model");
const bcrypt = require("bcrypt");
const ResetPass = async (req, res) => {
    const { resetBy, username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    if (resetBy === "OldPass") {
        const { OldPass, NewPass } = req.body;
        if (OldPass === NewPass) {
            return res.status(400).json({
                message: "The new password cannot be the same as the old one.",
            });
        }
        const User = await Usermodel.findOne({ username }).select("password");
        const IsPassMatch = await bcrypt.compare(OldPass, User.password);
        if (!IsPassMatch) {
            return res.status(400).json({ message: "Credintial Not Match " });
        }
        User.password = NewPass;
        User.save();
        
        return res.status(200).json({ message: "Password reset successfully" });
    }
};

module.exports = ResetPass;
