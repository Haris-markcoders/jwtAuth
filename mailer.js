
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'haris.markcoders@gmail.com',
    pass: 'lmepmevxqmwnkgqv'
  }
});

const sendVerificationEmail = async (userEmail, code) => {
  const mailOptions = {
    from: 'haris.markcoders@gmail.com',
    to: userEmail,
    subject: 'Email Verification',
    text: `Please verify your email by entering the following code at http://localhost:3000/verify ${code}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.log('Error sending email: ' + error);
  }
};

module.exports = {sendVerificationEmail}