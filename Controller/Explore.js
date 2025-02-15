const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");
const Contain = require("../model/Contain_model");

const explore = async (req, res) => {
    const { flag } = req.body;
    console.log(flag);
    
    const currentUserId = req.username;

    const ContacetData = async () => {
        if (flag === 0) {
            try {
                const alreadyFollowing = await Contact.find({
                    FllowBy: currentUserId,
                }).select("Fllower");
                const followingIds = alreadyFollowing.map(
                    (follow) => follow.Fllower
                );
                const suggestedUsers = await User.find({
                    username: { $nin: [...followingIds, currentUserId] },
                })
                    .select(["username", "profile", "ProfileUrl"])
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
                        totallike: 0,
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

module.exports = explore;