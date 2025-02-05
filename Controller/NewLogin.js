const Usermodel = require("../model/user_model");
const GroupJoindedModel = require("../model/Group/GroupJoindedModel");
const follow = require("../model/Fllow_model");
const MessageModel = require("../model/msg_model");
const Newlogin = async (req, res) => {
    const username = req.username;
    try {
        const allJoindedGroup = await GroupJoindedModel.aggregate([
            {
                $match: {
                    Member: username,
                },
            },
            {
                $lookup: {
                    from: "groups",
                    localField: "GroupName",
                    foreignField: "GroupName",
                    as: "GroupData",
                },
            },
            {
                $unwind: "$GroupData",
            },
            {
                $addFields: {
                    isMember: true,
                    isAdmine: {
                        $cond: {
                            if: {
                                $eq: ["$GroupData.Admin", username],
                            },
                            then: true,
                            else: false,
                        },
                    },
                    Role: {
                        $cond: {
                            if: {
                                $eq: ["$GroupData.Admin", username],
                            },
                            then: "Admin",
                            else: "$Role",
                        },
                    },
                },
            },
            {
                $project: {
                    GroupName: 1,
                    isMember: 1,
                    isAdmine: 1,
                    GroupName: "$GroupData.GroupName",
                    MaxMembers: "$GroupData.MaxMembers",
                    Admin: "$GroupData.Admin",
                    GroupDescription: "$GroupData.GroupDescription",
                    Role: 1,
                },
            },
        ]);

        const Allcontacet = await follow.aggregate([
            {
                $match: {
                    FllowBy: username,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "Fllower",
                    foreignField: "username",
                    as: "UserData",
                },
            },
            {
                $unwind: "$UserData",
            },
            {
                $project: {
                    username: "$UserData.username",
                    profile: "$UserData.profile",
                    type: "User",
                    Bio: "$UserData.Bio",
                },
            },
        ]);

        //  req.io.to(username).emit("Contact:Add:Group", Allcontacet);
        const AllcontacetUsermap = Allcontacet.map((data) => data.username);

        const AllMessage = await MessageModel.aggregate([
            {
                $match: {
                    $or: [
                        { From: { $in: AllcontacetUsermap } },
                        { For: { $in: AllcontacetUsermap } },
                    ],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: "$For",
                    document: { $first: "$$ROOT" },
                },
            },
            {
                $replaceRoot: { newRoot: "$document" },
            },
            {
                $project: {
                    For: 1,
                    From: 1,
                    Msg: 1,
                    Time: "$createdAt",
                },
            },
        ]);
        // req.io.to(username).emit("receiveMessage",AllMessage);
        const data = {
            contacet: [allJoindedGroup[0], Allcontacet[0]],
                message: AllMessage[0]
        }
        console.log(data);

        req.io.to(username).emit("Old:Data:All", data);
        res.status(200).json({message:"all data sended"});
    } catch (error) {
        console.error(error);
    }
}; 

module.exports = Newlogin;
