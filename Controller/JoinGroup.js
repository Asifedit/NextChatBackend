const MemberGroupmodel = require("../model/Group/GroupJoindedModel");
const group = require("../model/Group/GroupModel");
const JoinGroup = async (req, res) => {
    const { groupname } = req.body;

    try {
        const isExist = await group.findOne({ GroupName: groupname });
        console.log(isExist);
        if (!isExist)
            return res.status(404).json({ message: "Group not found" });

        const isMember = await MemberGroupmodel.findOne({
            GroupName: groupname,
            Member: req.username,
        });

        if (isMember)
            return res
                .status(400)
                .json({ message: "You are already a member of this group" });

        const newMember =new MemberGroupmodel({
            GroupName: groupname,
            Member: req.username,
            Role: "Member",
        });

         await newMember.save();
        const contacet = {
            username: isExist.GroupName,
            AdminName: isExist.Admin,
            type: "Group",
            
        };
        res.status(200).json({
            message: "Joined successfully",
            GroupData: contacet,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
module.exports = JoinGroup;
