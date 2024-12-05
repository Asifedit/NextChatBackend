const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MyMail,
        pass: process.env.MAIL_application_password,
    },
});

const SendMail = async (mailType, To, otherData = {}) => {
    let subject = "";
    let htmlContent = "";

    switch (mailType) {
        case "welcome":
            subject = "Welcome to Our Team!";
            htmlContent = `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome Email</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0;">
                    <table role="presentation" style="width: 100%; padding: 20px; background-color: #ffffff; text-align: center; border-radius: 8px;">
                        <tr>
                            <td>
                                <h1 style="color: #4CAF50;">Welcome to Our Team, ${
                                    otherData.name || "Asif"
                                }!</h1>
                                <p style="font-size: 18px; color: #555;">
                                    We're thrilled to have you on board. Let's achieve great things together!
                                </p>
                                <p style="font-size: 16px; color: #777;">
                                    Please feel free to reach out if you have any questions or need support.
                                </p>
                                <p style="font-size: 18px; color: #555;">
                                    Best regards,<br>
                                    The Team
                                </p>
                                <div style="margin-top: 30px;">
                                    <a href="https://github.com" target="_blank" style="color: #333; text-decoration: none; margin: 10px;">
                                        <i class="fab fa-github" style="font-size: 24px; color: #333;"></i> GitHub
                                    </a>
                                    <a href="https://www.linkedin.com" target="_blank" style="color: #333; text-decoration: none; margin: 10px;">
                                        <i class="fab fa-linkedin" style="font-size: 24px; color: #0077b5;"></i> LinkedIn
                                    </a>
                                    <a href="https://twitter.com" target="_blank" style="color: #333; text-decoration: none; margin: 10px;">
                                        <i class="fab fa-twitter" style="font-size: 24px; color: #1da1f2;"></i> Twitter
                                    </a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`;
            break;

        case "verification":
            subject = "Email Verification Code";
            htmlContent = `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0;">
                    <table role="presentation" style="width: 100%; padding: 20px; background-color: #ffffff; text-align: center; border-radius: 8px;">
                        <tr>
                            <td>
                                <h1 style="color: #4CAF50;">Verify Your Email Address</h1>
                                <p style="font-size: 18px; color: #555;">
                                    Hello ${otherData.name || "User"},<br><br>
                                    Your verification code is: <strong style="font-size: 20px; color: #333;">${
                                        otherData.verificationCode
                                    }</strong>
                                </p>
                                <p style="font-size: 16px; color: #777;">
                                    Please enter this code in the application to verify your email address.
                                </p>
                                <p style="font-size: 18px; color: #555;">
                                    Best regards,<br>
                                    The Team
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`;
            break;

        case "notification":
            subject = otherData.subject || "New Notification";
            htmlContent = `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Notification</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0;">
                    <table role="presentation" style="width: 100%; padding: 20px; background-color: #ffffff; text-align: center; border-radius: 8px;">
                        <tr>
                            <td>
                                <h1 style="color: #4CAF50;">New Notification</h1>
                                <p style="font-size: 18px; color: #555;">
                                    ${
                                        otherData.message ||
                                        "You have a new notification."
                                    }
                                </p>
                                <p style="font-size: 16px; color: #777;">
                                    Please check your account for more details.
                                </p>
                                <p style="font-size: 18px; color: #555;">
                                    Best regards,<br>
                                    The Team
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`;
            break;

        default:
            console.log("Invalid email type");
            return Promise.reject({ error: "Invalid email type" });
    }

    const mailOptions = {
        from: process.env.MyMail,
        to: To,
        subject: subject,
        html: htmlContent,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, mail) => {
            if (err) {
                reject({ error: "Error sending email", details: err });
            } else {
                resolve({
                    success: "Email sent successfully",
                    mailDetails: mail,
                });
            }
        });
    });
};

module.exports = SendMail;
