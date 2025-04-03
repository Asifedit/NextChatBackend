const Report = require("../model/Report_model");
const { uploadFile } = require("../Middleware/imagekit");
const path = require("path");
const fs = require("fs");
const report = async (req, res) => {
    const { description, priority, topic } = req.body;
    if (!description || !priority || !topic) {
        return res.status(400).json({
            message: "Please provide all required fields",
        });
    }
    if (description.length < 10 || description.length > 500) {
        return res.status(400).json({
            message:
                "Description must be at least 10  && less than 500 characters",
        });
    }

    if (topic.length < 3 || topic.length > 100) {
        return res.status(400).json({
            message:
                "Topic must be at least 3 && less than 100 characters long",
        });
    }

    if (req.file && req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
            message: "File size must be less than 5MB",
        });
    }
    if (req.file && !req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({
            message: "File must be an image",
        });
    }

    let responce = null;
    if (req.file) {
        const filePath = req.file.path;
        const fileName = `Report_${req.file.originalname}_${Math.floor(
            Math.random() * 999
        )}${path.extname(req.file.originalname)}`;
        console.log(filePath, fileName);
        try {
            const responces = await uploadFile(filePath, fileName, false);

            responce = responces;
        } catch (error) {
            console.log("error uploding img ", error);
            return res.stutas(200).json({ message: "Error To Uploding Image" });
        } finally {
            fs.unlinkSync(filePath);
        }
    }

    const report = new Report({
        username: req.username,
        topic: topic,
        description: description,
        attachment: responce?.url,
        priority,
        isNotificationNeeded: req.body.notification,
    });
    await report.save();
    res.status(201).json({
        message: "Report created successfully",
    });
};
module.exports = { report };