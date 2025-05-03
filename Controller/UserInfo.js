const Usermodel = require("../model/user_model");
const UserInfo = async (req, res) => {
    console.log("first");
    const { username } = req.body;
    const user = await Usermodel.findOne({ username: username }).select([
        "profile",
        "bio",
        "_id",
        "username",
    ]);
    console.log(user);
    res.status(200).json(user);
};
module.exports = UserInfo;
