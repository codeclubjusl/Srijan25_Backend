const nodemailer = require('nodemailer');
//const { render } = require('@react-email/components')

const transporter = nodemailer.createTransport({
  host: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



/*
const options = {
  from: 'you@example.com',
  to: 'user@gmail.com',
  subject: 'hello world',
  html: emailHtml,
};
*/

//await transporter.sendMail(options);
module.exports = { transporter };

