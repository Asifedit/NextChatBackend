const CreateGroupModel = require("../../model/Group/GroupModel");
const CreatePoolModel = require("../../model/Group/PoolModel");
const CreateGroup = async (req, res) => {
    const { groupName, description, maxMembers } = req.body;
    if (!groupName || !description || !maxMembers) {
        res.status(400).json({ messeage: "can not gat value" });
        return;
    }
    const Group = await CreateGroupModel.findOne({ GroupName: groupName });
    if (Group) {
        res.status(400).json({ messeage: "Group Alrady Created" });
        return;
    }
    const newGroup = new CreateGroupModel({
        GroupName: groupName,
        Admin: req.username,
        MaxMembers: maxMembers,
        GroupDescription: description,
        Role: "Admin",
    });
    await newGroup.save();
    res.status(200).json({ newGroup, messeage: "Group Created" });
};

const CreatePool = async (req, res) => {
    const { topic, options, explanation, groupname } = req.body;
    console.log(req.body);

    if (!topic || !options || !groupname) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }
    
    const newPool = new CreatePoolModel({
        GroupId: groupname,
        Question: topic,
        Options: options,
        Explanation: explanation || null,
        CreatedBy: req.username,
    });

    await newPool.save();
req.io.to(groupname).emit("Created:Pool", newPool);
    res.status(200).json({ newPool, message: "Pool Created" });
};

module.exports = { CreateGroup, CreatePool };
