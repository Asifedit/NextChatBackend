const nodemailer = require("nodemailer");

// Set up the transporter with ProtonMail SMTP via ProtonMail Bridge
const transporter = nodemailer.createTransport({
    host: "127.0.0.1", // Use the ProtonMail Bridge's SMTP server
    port: 1025, // The port used by ProtonMail Bridge for SMTP
    secure: false, // Set to 'false' because the bridge uses an unencrypted connection
    auth: {
        user: "email.web.asif@proton.me", // Your ProtonMail email
        pass: process.env.pasword, // The password from ProtonMail Bridge
    },
});

// Define the email details
const mailOptions = {
    from: "email.web.asif@proton.me", // Your email address
    to: "asifhossainpc111@gmail.com", // Recipient's email address
    subject: "Test Email from ProtonMail", // Subject
    text: "This is a test email sent using ProtonMail with Nodemailer!", // Email content
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log("Error sending email:", error);
    }
    console.log("Email sent:", info.response);
});
