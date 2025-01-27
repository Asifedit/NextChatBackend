const useModel = require("../model/user_model");
const groupModel = require("../model/Group/GroupModel");

const Search = async (req, res) => {
    try {
        const { quary } = req.body;

        const user = await useModel.findOne({ username: quary });

        const group = await groupModel.findOne({ GroupName: quary });
        console.log(group);
        
        const result = {
            user: {
                username: user.username,
                profile: user.profile,
                bio: user.bio,
            },
            group: {
                groupName: group?.GroupName,
                groupDescription: group?.GroupDescription,
                groupPicture: group?.GroupPicture,
                creator: group.Admin,
            },
        };

        console.log(result);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    Search,
};
