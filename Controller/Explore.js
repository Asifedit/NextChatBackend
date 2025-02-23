const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");
const Contain = require("../model/Contain_model");

const explore = async (req, res) => {
    const { LastPostTime, FirstPostTime, flag } = req.body;
    console.log(LastPostTime, FirstPostTime);

    const limit = 10; 
    const ContacetData = async () => {
        if (LastPostTime || FirstPostTime) {
            return;
        }
        try {
            const AllUesr = [req.username];
            const AlradyFllow = await Contact.find({ FllowBy: req.username });

            AlradyFllow.map((item) => {
                AllUesr.push(item.Fllower);
            });

            const suggestedUsers = await User.aggregate([
                {
                    $match: {
                        username: { $nin: AllUesr },
                    },
                },

                {
                    $limit: limit,
                },
            ]);

            return [suggestedUsers, { DataType: "contacet" }];
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    };

    const data = async () => {
        try {
            let matchQuery = {};
            if (FirstPostTime && LastPostTime) {
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