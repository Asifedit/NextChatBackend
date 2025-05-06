const MsgModel = require("../../model/msg_model");

const UnseenMsg = async (req, res) => {
    const username = req.username;
    console.log(username);
    try {
        const oldMsg = await MsgModel.findOneAndUpdate(
            { For: username, isSend: false },
            { isSend: true },
            { new: true }
        ).select("-isSend -__v");
        console.log(oldMsg);
        res.status(200).json(oldMsg);
    } catch (error) {
        console.log("Error while unsending message.", error);
    }
};
module.exports = UnseenMsg;
