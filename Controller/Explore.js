const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");
const Contain = require("../model/Contain_model");

const explore = async (req, res) => {
    const { flag } = req.body;
    console.log(flag);
    const limit = 2; 
    const ContacetData = async () => {
            try {
                const suggestedUsers = await User.find()
                    .select(["username", "profile", "ProfileUrl"])
                    .skip(5 * flag - 5)
                    .limit(5);
                    
                console.log(suggestedUsers);
                

                return [suggestedUsers, { DataType: "contacet" }];
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({
                    message: "Internal server error",
                    error: error.message,
                });
            }
    };

    const data = async () => {
        try {
            console.log(limit * flag - limit);
            
            const data = await Contain.aggregate([
                {
                    $skip: limit *flag -limit,
                },
                {
                    $limit: limit,
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
    console.log(final());
    res.status(200).json(final());
};

module.exports = explore;
