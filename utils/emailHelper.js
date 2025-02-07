const nodemailer = require("nodemailer");


const mailHelper = async (options) =>{
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

    const message = {
        from: process.env.SMTP_USER, 
        to: options.email, 
        subject: options.subject, 
        text: options.message, 
    }
    
    await transporter.sendMail(message);
}

module.exports = mailHelper