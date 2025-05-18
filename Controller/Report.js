const Report = require("../model/Report_model");
const { uploadFile } = require("../Middleware/imagekit");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { URL } = require("url");

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const sendDiscordWebhook = (webhookUrl, payload) => {
    return new Promise((resolve, reject) => {
        const url = new URL(webhookUrl);
        const data = JSON.stringify(payload);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        };

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => resolve(body));
        });

        req.on("error", (e) => reject(e));
        req.write(data);
        req.end();
    });
};

const report = async (req, res) => {
    const { description, priority, topic, notification } = req.body;

    try {
        if (!description || !priority || !topic) {
            return res
                .status(400)
                .json({ message: "Please provide all required fields" });
        }

        if (description.length < 10 || description.length > 500) {
            return res.status(400).json({
                message: "Description must be between 10 and 500 characters",
            });
        }

        if (topic.length < 3 || topic.length > 100) {
            return res.status(400).json({
                message: "Topic must be between 3 and 100 characters",
            });
        }

        if (req.file && req.file.size > 5 * 1024 * 1024) {
            return res
                .status(400)
                .json({ message: "File size must be less than 5MB" });
        }

        if (req.file && !req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({ message: "File must be an image" });
        }

        let imageUrl = null;
        if (req.file) {
            const filePath = req.file.path;
            const fileName = `Report_${req.file.originalname}_${Math.floor(
                Math.random() * 999
            )}${path.extname(req.file.originalname)}`;
            try {
                const uploaded = await uploadFile(filePath, fileName, true);
                console.log(uploaded);
                imageUrl = uploaded.url;
            } catch (error) {
                console.error("Error uploading image:", error);
                return res
                    .status(500)
                    .json({ message: "Error uploading image" });
            } finally {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.log("error to delete", filePath);
                }
            }
        }

        const newReport = new Report({
            username: req.username,
            topic,
            description,
            attachment: imageUrl,
            priority,
            isNotificationNeeded: notification,
        });

        await newReport.save();

        const embedPayload = {
            username: "💡 FREGMENT ReportBot",
            avatar_url: "https://iili.io/3jklQRf.jpg",
            embeds: [
                {
                    title: "🚨 New Report Received!",
                    description:
                        "🆕 A new issue has been submitted. Please review the following details:",
                    color:
                        priority === "high"
                            ? 0xff0000
                            : priority === "medium"
                            ? 0xffcc00
                            : 0x00cc66,
                    fields: [
                        {
                            name: "👤 User",
                            value: `${req.username}`,
                            inline: true,
                        },
                        {
                            name: "⚡ Priority",
                            value: `${priority.toUpperCase()}`,
                            inline: true,
                        },
                        { name: "📌 Topic", value: `${topic}`, inline: false },
                        {
                            name: "🧾 Description",
                            value: `*${description}*`,
                            inline: false,
                        },
                        {
                            name: "🔔 Notify Admins",
                            value: notification ? "✅ Yes" : "❌ No",
                            inline: true,
                        },
                        {
                            name: " 🖼️ Img",
                            value:  imageUrl ? imageUrl : 'no img',
                            inline: false,
                        },
                        {
                            name: "🕓 Submitted At",
                            value: new Date().toLocaleString(),
                            inline: false,
                        },
                    ],

                    footer: {
                        text:
                            "📡 FREGMENT Reporting System • v1.0 • " +
                            new Date().toLocaleString(),
                        icon_url: "https://iili.io/3jklQRf.jpg",
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        try {
            const responce = await sendDiscordWebhook(DISCORD_WEBHOOK_URL, embedPayload);
            console.log(responce);
          
        } catch (err) {
            console.error("Failed to send Discord webhook:", err);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error TO Submit" });
    }
    res.status(200).json({ message: "Report created successfully" });
};

module.exports = { report };