const User = require("../model/user_model");
const Contact = require("../model/Fllow_model");

const follow = async (req, res) => {
    try {
        const { username } = req.body;
        const loggedInUser = req.username;

        if (username === loggedInUser) {
            return res
                .status(400)
                .json({ message: "You cannot follow yourself." });
        }
        const existingFollow = await Contact.find({
            $or: [{ FllowBy: loggedInUser }, { Fllower: loggedInUser }],
        });

        const isFollowByExists = existingFollow.some(
            (doc) => doc.FllowBy === loggedInUser
        );
        if (isFollowByExists) {
            return res
                .status(400)
                .json({ message: "You are already following this user." });
        }
        // return res.status(400);

        const newFollow = new Contact({
            FllowBy: loggedInUser,
            Fllower: username,
        });
        await newFollow.save();
        const isFollowByUsername = existingFollow.some(
            (doc) => doc.FllowBy === username
        );

        if (!isFollowByUsername) {
            // Emit follow notification to the followed user
            req.io.to(username).emit("Notification", {
                Type: "Follower",
                Text: "You got a new follower!",
                From: loggedInUser,
                timpStamp: new Date(),
                id: newFollow._id,
            });
        }

        const userdetails = await User.findOne({
            username: username,
        }).select(["username", "profile", "bio", "_id"]);

        res.status(200).json({
            message: "Successfully followed the user.",
            userdetails: userdetails,
        });
    } catch (error) {
        console.error("Follow Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
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
        res.status(204).json({ message: "No Contacet Founded" });
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
