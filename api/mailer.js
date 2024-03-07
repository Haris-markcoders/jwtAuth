import { createTransport } from 'nodemailer';

const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: 'haris.markcoders@gmail.com',
    pass: 'lmepmevxqmwnkgqv'
  }
});

export const sendVerificationEmail = async (userEmail, code) => {
  await new Promise(async (resolve, reject) => {
    try{
      const mailOptions = {
        from: 'haris.markcoders@gmail.com',
        to: userEmail,
        subject: 'Email Verification',
        text: `Please verify your email by entering the following code at http://localhost:3000/verify ${code}`
      };
    
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        resolve('Email sent: ' + info.response)
      } catch (error) {
        console.log('Error sending email: ' + error);
        reject(error)
      }
    }catch(e){
      console.log(e)
    }
  })
};
