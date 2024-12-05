const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "asif.emaiddddlservice@gmail.com",
        pass: "ccpl tvbl bdmt nltd", 
    },
});

// Function to send emails based on the email type and parameters
const sendEmail = (emailType, to, params = {}) => {
    
};

module.exports = sendEmail;




const mailOption = {
    from: "asif.emailservice@gmail.com",
    to: "asifhossin867@gmail.com",
    subject: "hay asif",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0;">
    <table role="presentation" style="width: 100%; padding: 20px; background-color: #ffffff; text-align: center;">
        <tr>
            <td>
                <h1 style="color: #4CAF50;">Welcome to Our Team, Asif!</h1>
                <p style="font-size: 18px; color: #555;">
                    We're excited to have you on board. We look forward to achieving great things together.
                </p>
                <p style="font-size: 16px; color: #777;">
                    Please don't hesitate to reach out if you have any questions or need assistance.
                </p>
                <p style="font-size: 18px; color: #555;">
                    Best regards,<br>
                    The Team
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
 `,
};

try {
    transporter.sendMail(mailOption, (err, mail) => {
        if (err) {
            console.log(err);
            return { sucess: false };
        } else {
            console.log(`Email Sent 
                To ${mail.envelope.to} 
                messageId:${mail.messageId} 
                messageTime:${mail.messageTime}
                rejected:${mail.rejected[0]}`);
            return { sucess: true, mail };
        }
    });
} catch (error) {
    console.log(error);
}
