const User = require("../model/user_model");
const { uploadFile } = require("../Middleware/imagekit");

const UpdateProfile = async (req, res) => {
    try {
        const { bio, birthDate, favorites } = req.body;
        const updateFields = {};

        // Update simple fields
        if (bio) updateFields.bio = bio;
        if (birthDate) updateFields.BirthDay = birthDate;

        // Update favorites (array of objects)
        if (Array.isArray(favorites) && favorites.length > 0) {
            updateFields.userAbout = favorites.map((fav) => ({
                Topic: fav.Topic || "",
                Data: fav.Data || "",
            }));
        }

        // Handle profile image upload
        if (req.file) {
            const uploadedResponse = await uploadFile(
                req.file.path,
                req.file.filename,
                false
            );
            updateFields.profile = uploadedResponse.url;
        }

        // Find and update the user
        const updatedUser = await User.findOneAndUpdate(
            { username: req.username },
            { $set: updateFields },
            {
                new: true,
                projection: {
                    password: 0,
                    phonenumber: 0,
                    refToken: 0,
                    TwoFAToken: 0,
                },
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("UpdateProfile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { UpdateProfile };
