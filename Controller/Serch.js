const useModel = require("../model/user_model");
const groupModel = require("../model/Group/GroupModel");
const GroupMember = require("../model/Group/GroupJoindedModel");
const Search = async (req, res) => {
    try {
        const { quary } = req.body;

        const user = await useModel.findOne({ username: quary });

        // const group = await groupModel.findOne({ GroupName: quary });
        const group = await groupModel.aggregate([
            {
                $match: {
                    GroupName: quary,
                },
            },
            {
                $lookup: {
                    from: "groupjoindedmodels",
                    localField: "GroupName",
                    foreignField: "GroupName",
                    as: "joined",
                },
            },
            {
                $addFields: {
                    isAdmin: {
                        $in: [req.username, "$joined.Member"], // Check if the current username exists in the "Member" array
                    },
                },
            },
            {
                $addFields: {
                    TotalMembers: {
                        $size: "$joined",
                    },
                },
            },
            {
                $addFields: {
                    isMember: {
                        $in: [req.username, "$joined.Member"],
                    },
                },
            },
            {
                $project: {
                    GroupName: 1,
                    Admin: 1,
                    MaxMembers: 1,
                    GroupDescription: 1,
                    GroupPicture: 1,
                    isAdmin: 1,
                    TotalMembers: 1,
                    isMember:1,
                },
            },
        ]);

        const result = {
            group: group[0],
            user,
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    Search,
};
