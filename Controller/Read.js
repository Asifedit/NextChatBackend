const Contain = require("../model/Contain_model");
const User = require("../model/user_model");
const Fllow = require("../model/Fllow_model");
const userprofile = async (req, res) => {
    const limit = 2;
    const { username, page } = req.body;
    console.log(page);

    if (!username || page == undefined) {
        return res.status(400).json({ message: "Unexpacted Error" });
    }
    if (page == 1) {
        const UserProfile = await User.aggregate([
            {
                $match: {
                    username: username,
                },
            },
            {
                $lookup: {
                    foreignField: "Fllower",
                    localField: "username",
                    from: "fllows",
                    as: "result",
                },
            },
            {
                $unwind: "$result",
            },
            {
                $project: {
                    username: 1,
                    profile: 1,
                    bio: 1,
                    BirthDay: 1,
                    IsFllow: {
                        $cond: {
                            if: { $eq: ["$result.FllowBy", req.username] },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
        ]);
        const UserPost = await Contain.find({ CreatBy: req.username })
            .select(["-__v", "-CreatBy"])
            .limit(limit);
        return res.status(200).json([
            [...UserProfile, { ContainType: "profileData" }],
            [UserPost, { ContainType: "Posts" }],
        ]);
    } else {
        const UserPost = await Contain.find({ CreatBy: req.username })
            .select(["-__v", "-CreatBy"])
            .skip((page - 1) * limit)
            .limit(limit);
        
        if (UserPost.length) {
            return res
                .status(200)
                .json([[UserPost, { ContainType: "Posts" }]]);
        } else {
            return res.status(200).json([]);
        }
    }
};
module.exports = { userprofile };
