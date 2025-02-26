const nodemailer = require('nodemailer');
//const { render } = require('@react-email/components')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPaymentRecievedMail = (recipientMail, nameOnShirt, size, color) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: recipientMail,
    subject: "Payment Verification in Progress",
    text: `Dear Customer,

We have received your payment request and are currently verifying it. Here are the details of your order:

- Name on Shirt: ${nameOnShirt}
- Size: ${size}
- Color: ${color}

We will update you once the verification is complete.

Thank you for your patience!

Best regards,
Your Team`,
  };

  console.log("Sending email to:", recipientMail);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email to", recipientMail, ":", error);
    } else {
      console.log("Email sent successfully to", recipientMail, ":", info.response);
    }
  });
};



/*
const options = {
  from: 'you@example.com',
  to: 'user@gmail.com',
  subject: 'hello world',
  html: emailHtml,
};
*/

//await transporter.sendMail(options);
module.exports = { sendPaymentRecievedMail };

