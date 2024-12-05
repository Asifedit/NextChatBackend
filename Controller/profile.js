const User = require("../model/user_model");

const UpdateProfile = async (req, res) => {
    const data = req.body;
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    console.log("File uploaded:", req.file);
    try {
        const updateFields = {};
        if (data.bio) updateFields.bio = data.bio;
        if (data.birthDate) updateFields.BirthDay = new Date(data.birthDate);
        if (Array.isArray(data.favorites) && data.favorites.length > 0) {
            updateFields.userAbout = data.favorites.map((fav) => {
                return {
                    Topic: fav.Topic || "",
                    Data: fav.Data || "", 
                };
            });
        }
        if (req.file) {
            updateFields.profilePicture = `/uploads/${req.file.filename}`;
        }
        const updateQuery = {
            $set: updateFields,
        };
        const user = await User.findOneAndUpdate(
            { username: req.username }, // Assumes req.username is set from the authenticated user
            updateQuery,
            {
                new: true, // Return the updated document
                projection: {
                    password: 0,
                    phonenumber: 0,
                    refToken: 0,
                    TwoFAToken: 0,
                },
            }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
module.exports = { UpdateProfile };
