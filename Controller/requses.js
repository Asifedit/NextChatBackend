const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");

const follow = async (req, res) => {
    const { username } = req.body;
    console.log(username);
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

    const user = await User.findOne({ username: username }).select([
        "username",
        "profile",
    ]);

    req.io.to(req.username).emit("Contacet", user);
    req.io.to(username).emit("Notification", {
        Type: "Follower",
        Text: "You Got A New Follower",
        Profile: user?.profile || "",
        From: req.username,
        timpStamp: Date(),
        id: Contactadded._id,
    });
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
                    type: "User",
                },
            },
        ]);
        if (UserContact.length >= 1) {
            return res.status(200).json(UserContact);
        }
        res.status(400).json({ message: "No Contacet Found" });
    } catch (error) {
        console.log(error);
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

module.exports = {
    follow,
    Contacets,
    FindUser,
};