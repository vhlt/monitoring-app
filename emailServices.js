const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendTestEmail = (to) => {
    const mailOptions = {
        to,
        from: process.env.EMAIL_USER,
        subject: 'Test Email',
        text: `This is a test email from your Node.js application.`
    };

    return transporter.sendMail(mailOptions);
};

// sendTestEmail("vuonghoclaptrinh@gmail.com");

const sendThankYouEmail = async (to, username) => {
    const mailOptions = {
        to,
        from: process.env.EMAIL_USER,
        subject: 'Thank You for Registering',
        text: `Thank you for registering, ${username}! Your account has been created successfully.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Thank you email sent successfully');
    } catch (error) {
        console.error('Error sending thank you email:', error);
    }
}

const sendResetPasswordEmail = async (to, token) => {
    const mailOptions = {
        to,
        from: process.env.EMAIL_USER,
        subject: 'Reset Password',
        text: `You have requested a password reset. Click on the following link to reset your password: http://localhost:5000/reset-password/${token}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully');
    } catch (error) {
        console.error('Error sending reset password email:', error);
    };
};

module.exports = {
    sendThankYouEmail,
    sendResetPasswordEmail,
};