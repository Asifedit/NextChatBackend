const Userconfig = require("../../model/UserConfig");

const PinOpration = async (req, res) => {
    const { pin, OldPIN, Type } = req.body;
    if (!pin) {
        return res.status(400).json({ message: "PIN is Require" });
    }
    if (OldPIN) {
        if (!OldPIN) {
            return res.status(400).json({ message: "OldPIN is Require" });
        }
        try {
            const UserConfigration = await Userconfig.findOneAndReplace(
                {
                    username: req.username,
                    Two_Step_Verification_Coad: OldPIN,
                },
                {
                    Two_Step_Verification_Coad: pin,
                }
            );
            if (!UserConfigration) {
                return res.status(400).json({
                    message: "Cannot Conform Your Pin ",
                });
            }
            return res.status(200).json({
                message: "Sucessfully  Change Your Pin",
                Newpin: UserConfigration.UserSetPin,
            });
        } catch (error) {
            console.error(error);
            return res.status(200).json({ message: "Somthing Wrong" });
        }
    } else {
        try {
            const UserConfigration = await Userconfig.findOne({
                username: req.username,
            });
            if (UserConfigration) {
                if (UserConfigration?.Two_Step_Verification_Coad) {
                    return res.status(400).json({
                        message: "Somthing Weong : We cannot undastand",
                    });
                } else {
                    UserConfigration.Two_Step_Verification_Coad = pin;
                    await UserConfigration.save();
                }
            } else {
                const newUserConfigration = new Userconfig({
                    username: req.username,
                    Two_Step_Verification_Coad: pin,
                });
                await newUserConfigration.save();
            }
            res.status(200).json({ message: "sucesfullly created" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Somthing Weong" });
        }
    }
};

module.exports = PinOpration;
