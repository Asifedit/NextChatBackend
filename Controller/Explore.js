const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");
const Contain = require("../model/Contain_model");

const explore = async (req, res) => {
    const { LastPostTime, FirstPostTime, flag } = req.body; // Use timestamps for cursor-based pagination
    const limit = 10; // Number of posts to fetch per request
    console.log(LastPostTime, FirstPostTime);

    // Fetch suggested users
    const ContacetData = async () => {
        try {
            const suggestedUsers = await User.find()
                .select(["username", "profile", "ProfileUrl"])
                .skip(flag * limit - limit)
                .limit(limit); // Fetch the latest 5 users
            return [suggestedUsers, { DataType: "contacet" }];
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error; // Propagate the error to be handled in the main function
        }
    };

    // Fetch posts based on timestamps
    const data = async () => {
        try {
            let matchQuery = {};

            if (FirstPostTime && LastPostTime) {
                // Exclude posts created between FirstPostTime and LastPostTime
                matchQuery.$or = [
                    { createdAt: { $lt: new Date(LastPostTime) } },
                    { createdAt: { $gt: new Date(FirstPostTime) } },
                ];
            } else if (FirstPostTime) {
                matchQuery.createdAt = { $gt: new Date(FirstPostTime) };
            } else if (LastPostTime) {
                matchQuery.createdAt = { $lt: new Date(LastPostTime) };
            }

            const data = await Contain.aggregate([
                { $match: matchQuery },
                { $sort: { createdAt: -1 } },
                { $limit: limit },

                { $addFields: { postIdAsString: { $toString: "$_id" } } },

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
                        TotalLike: { $size: { $ifNull: ["$totallike", []] } },
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

                { $project: { __v: 0, totallike: 0 } },
            ]);

            return data.length ? [data, { DataType: "contain" }] : false;
        } catch (error) {
            console.error("Error fetching posts:", error);
            throw error;
        }
    };

    try {
        const DATA = await data();
        const Cont = await ContacetData();

        const final = () => {
            const result = [];
            if (DATA) result.push(DATA);
            if (Cont) result.push(Cont);
            return result;
        };

        res.status(200).json(final());
    } catch (error) {
        console.error("Error in explore function:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = explore;
