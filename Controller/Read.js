const Contacets = require("../model/Contain_model");
const User = require("../model/user_model");
const userprofile = async (req, res) => {
    const { username, page } = req.body;
    if (!username || page == undefined) {
        return res.status(400).json({ message: "Unexpacted Error" });
    }
    const limit = 1;
    const Data = await Contacets.find({ CreatBy: username })
        .skip(page * limit)
        .limit(limit)
        .select("-__v");

    if (page < 2) {
        const user = await User.findOne({ username }).select([
            "-createdAt",
            "-updatedAt",
        ]);
        return res.status(200).json({ contain: Data, user: user });
    }
    res.status(200).json({ contain: Data });
};
module.exports = { userprofile };
