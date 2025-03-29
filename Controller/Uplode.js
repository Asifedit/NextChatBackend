const path = require("path");
const Contain = require("../model/Contain_model");

const HandelFile = async (req, res) => {
    console.log(req.body);
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const publicFilePath = path.join(
        __dirname,
        `../../public/${req.file.filename}`
    );
    return res.status(200).json({
        message: "File uploaded successfully",
        filePath: publicFilePath,
    });
};

const HandelText = async (req, res) => {
    const { Title, Data } = req.body;
    try {
        const data = await Contain({
            CreatBy: req.username,
            ContainTitle: Title,
            Contain: Data,
            ContainType: "text",
        }).save();
        if (data) {
            res.status(200).json({ message: "successful Uploded" });
        }
    } catch (error) {
        console.log("error is", error._message);
        res.status(500).json({ message: "Somthing Worng Please try Again" });
    }
};
module.exports = { HandelFile, HandelText };