const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();

// Set up Nodemailer transport
const transporter = nodemailer.createTransport({
    host:process.env.Mail_Host || "smtp.gmail.com",
    port: process.env.Mail_Port || 587,
    secure: false,
    auth: {
        user: process.env.MyMail, 
        pass: process.env.MAIL_application_password, 
    },
});

// Send email function
const sendMail = async (mailType, to, otherData = {}) => {
    try {
        // Define template path
        const templatePath = path.join(
            __dirname,
            "../templates",
            `${mailType}.ejs`
        );

        // Render the template with dynamic data
        const htmlContent = await ejs.renderFile(templatePath, otherData);

        // Define email subject based on email type
        let subject = "";
        switch (mailType) {
            case "welcome":
                subject = "Welcome to Our Team!";
                break;
            case "verification":
                subject = "Email Verification Code";
                break;
            case "notification":
                subject = otherData.subject || "New Notification";
                break;
            case "ResetPassEmail":
                subject = otherData.subject || "Reset Nexchat password";
                break;
            default:
                throw new Error("Invalid email type");
        }

        // Set up the email options
        const mailOptions = {
            from: '"NexChat Team" <nextchatfrontend.pages.dev>',
            to: to,
            subject: subject,
            html: htmlContent,
        };

        // Send the email
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    reject({ error: "Error sending email", details: err });
                } else {
                    resolve({
                        success: "Email sent successfully",
                        mailDetails: info,
                    });
                }
            });
        });
    } catch (err) {
        return Promise.reject({
            error: "Error in rendering email template",
            details: err,
        });
    }
};

module.exports = sendMail;
