const User = require("../model/user_model");

const UpdateProfile = async (req, res) => {
    const data = req.body;
    console.log("", data.favorites);

    try {
        const updateFields = {};
        if (data.bio) updateFields.bio = data.bio;
        if (data.birthDate)
            updateFields.BirthDay = data.birthDate;
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
        console.log(updateFields);

        const updateQuery = {
            $set: updateFields,
        };

        const user = await User.findOneAndUpdate(
            { username: req.username },
            updateQuery,
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
