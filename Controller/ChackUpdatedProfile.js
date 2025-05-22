const usermodel = require("../model/user_model");

const ChackUpdatedProfile = async (req, res) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: "Invalid request format." });
        }

        const matchConditions = req.body.map(({ username, __v }) => ({
            username,
            __v: { $gt: Number(__v) },
        }));

        if (!matchConditions.length) {
            return res.status(400).json({ error: "No valid conditions." });
        }

        const pipeline = [
            { $match: { $or: matchConditions } },
            {
                $project: {
                    username: 1,
                    profile: 1,
                    bio: 1,
                    __v: 1,
                    _id: 1,
                    type: { $literal: "User" }, 
                },
            },
        ];

        const updatedUsers = await usermodel.aggregate(pipeline);

        return res.status(200).json(updatedUsers);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = ChackUpdatedProfile;
