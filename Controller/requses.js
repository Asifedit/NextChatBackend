const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");
const path = require("path");
const Contain = require("../model/Contain_model");

const explore = async (req, res) => {
    const { flag } = req.body;
    const currentUserId = req.username;
    const ContacetData = async () => {
        if (flag === 0) {
            try {
                const alreadyFollowing = await Contact.find({
                    FllowBy: currentUserId,
                })
                    .select("Fllower")
                    .lean();
                const followingIds = alreadyFollowing.map(
                    (follow) => follow.Fllower
                );
                const suggestedUsers = await User.find({
                    username: { $nin: [...followingIds, currentUserId] },
                })
                    .select(["username", "profile"])
                    .limit(10)
                    .skip(flag * 10);
                if (suggestedUsers.length == 0) {
                    return false;
                }
                return [suggestedUsers, { DataType: "contacet" }];
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({
                    message: "Internal server error",
                    error: error.message,
                });
            }
        }
    };

    const data = async () => {
        try {
            // const data = await Contain.find().select("-__v").limit(5).lean();
            const data = await Contain.aggregate([
                {
                    $limit: 1,
                },
                {
                    $addFields: {
                        postIdAsString: { $toString: "$_id" },
                    },
                },
                {
                    $lookup: {
                        from: "likes",
                        localField: "postIdAsString", 
                        foreignField: "postId",
                        as: "totallike", 
                    },
                },
                {
                    $addFields: {
                        TotalLike: {
                            $size: { $ifNull: ["$totallike", []] },
                        },
                        IsLike: {
                            $cond: {
                                if: {
                                    $in: [
                                        req.username,
                                        "$totallike.likeUserid",
                                    ],
                                },
                                then: true,
                                else: false,
                            },
                        },
                    },
                },
                {
                    $project: {
                        __v: 0,
                        "totallike":0
                    },
                },
            ]);

            if (!data) {
                return false;
            }
            return [data, { DataType: "contain" }];
        } catch (error) {}
    };

    const DATA = await data();
    const Cont = await ContacetData();
    const final = () => {
        const Array = [DATA, Cont];
        if (!Cont) {
            Array.pop(Cont);
        } else if (!DATA) {
            Array.pop(DATA);
        }
        return Array;
    };
    res.status(200).json(final());
};

const follow = async (req, res) => {
    const { username } = req.body;
    const Contactadded = await Contact.updateOne(
        {
            FllowBy: req.username,
            Fllower: username,
        },
        {
            $setOnInsert: {
                FllowBy: req.username,
                Fllower: username,
            },
        },
        { upsert: true }
    );
    // await Contactadded.save();
    console.log(Contactadded);

    const user = await User.findOne({ username: username }).select([
        "username",
        "profile",
        "Bio",
    ]);
    console.log(user);

    req.io.to(req.username).emit("Contacet", user);
    req.io.to(username).emit("Contacet", user);
    res.status(200).json({ message: "susessfully fllow" });
};

const Contacets = async (req, res) => {
    try {
        const UserContact = await Contact.aggregate([
            {
                $match: {
                    FllowBy: req.username,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "Fllower",
                    foreignField: "username",
                    as: "followTo",
                },
            },
            {
                $unwind: "$followTo",
            },
            {
                $project: {
                    _id: "$followTo._id",
                    username: "$followTo.username",
                    profile: "$followTo.profile",
                    Bio: "$followTo.bio",
                },
            },
        ]);

        if (UserContact.length >= 1) {
            console.log(UserContact);
            return res.status(200).json(UserContact);
        }
        res.status(400).json({ message: "No Contacet Found" });
    } catch (error) {
        console.log(error);
    }
};

const HandelFile = async (req, res) => {
    console.log(req.body);
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const publicFilePath = path.join(
        __dirname,
        `../../public/${req.file.filename}`
    );
    return res.status(200).json({
        message: "File uploaded successfully",
        filePath: publicFilePath,
    });
};

const HandelText = async (req, res) => {
    const { Title, Data } = req.body;
    try {
        const data = await Contain({
            CreatBy: req.username,
            ContainTitle: Title,
            Contain: Data,
            ContainType: "text",
        }).save();
        if (data) {
            console.log("data", data);
            res.status(200).json({ message: "successful Uploded" });
        }
    } catch (error) {
        console.log("error is", error._message);
        res.status(500).json({ message: "Somthing Worng Please try Again" });
    }
};

const FindUser = async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username: username }).select([
            "username",
            "profile",
            "bio",
        ]);
        if (!user) {
            return res.status(400).json({ message: "User not available" });
        }
        res.status(200).json({ data: user });
    } catch (error) {
        console.log(error);
    }
};

const myprofile = async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                username: req.username,
            },
        },
        {
            $lookup: {
                localField: "username",
                foreignField: "username",
                from: "userconfigs",
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
                _id: 1,
                userAbout: 1,
                bio: 1,
                BirthDay: 1,
                EnablePinAuth: {
                    $cond: {
                        if: {
                            $gt: [
                                {
                                    $strLenCP: {
                                        $ifNull: [
                                            "$result.Two_Step_Verification_Coad",
                                            "",
                                        ],
                                    },
                                },
                                0,
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                EnableTwoFaAppAuth: {
                    $cond: {
                        if: {
                            $and: [
                                {
                                    $gt: [
                                        {
                                            $strLenCP: {
                                                $ifNull: [
                                                    "$result.TwoFa_App_Token",
                                                    "",
                                                ],
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                EnablePassKey: {
                    $cond: {
                        if: {
                            $and: [
                                {
                                    $gt: [
                                        {
                                            $strLenCP: {
                                                $ifNull: [
                                                    "$result.PassKey_Token",
                                                    "",
                                                ],
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
    ]);
    res.status(200).json({ data: user });
};

module.exports = {
    explore,
    follow,
    Contacets,
    HandelFile,
    HandelText,
    FindUser,
    myprofile,
};
