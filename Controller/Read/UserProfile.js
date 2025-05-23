const Contain = require("../../model/Contain_model");
const User = require("../../model/user_model");
const userprofile = async (req, res) => {
    const { username, page } = req.body;
    const Limit = 5;
    console.log(username, page);
    
    const UserProfile = await User.findOne({ username }).select([
        "username",
        "profile",
        "BirthDay",
        "bio"
    ]);

    const UserPosts = await Contain.find({ CreatBy: username })
        .skip(Limit * page - Limit)
        .limit(Limit);
    res.status(200).json({
        userDetails: UserProfile ? UserProfile : null,
        IsOwn: req.username == username,
        posts: UserPosts,
    });
};

module.exports = { userprofile };