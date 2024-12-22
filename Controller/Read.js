const Contain = require("../model/Contain_model");
const User = require("../model/user_model");
const userprofile = async (req, res) => {
    const limit = process.env.SerchFrofileDAtaLimit || 2;

    const { username, page } = req.body;
    if (!username || page == undefined) {
        return res.status(400).json({ message: "Unexpacted Error" });
    }
    if (page == 1) {
        const UserProfileData = await User.aggregate([
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
                $unwind: {
                    path: "$result",
                    preserveNullAndEmptyArrays: true,
                },
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
            .select(["-__v"])
            .limit(limit);

        return res.status(200).json([
            [...UserProfileData, { ContainType: "profileData" }],
            [UserPost, { ContainType: "Posts" }],
        ]);
    } else {
        const UserPost = await Contain.find({ CreatBy: req.username })
            .select(["-__v", "-CreatBy"])
            .skip((page - 1) * limit)
            .limit(limit);

        if (UserPost.length) {
            return res.status(200).json([[UserPost, { ContainType: "Posts" }]]);
        } else {
            return res.status(200).json([]);
        }
    }
};
const ViweSinglePOst = async (req, res) => {
    console.log(req.body);
    const post = await Contain.findById(req.body.pid).select("-__v")
    console.log(post);
    res.status(200).json(post);
};
module.exports = { userprofile, ViweSinglePOst };
