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
Srijan 2025`,
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
const sendPaymentVerifiedMail = (recipientMail, isVerified, color, size) => {
  const subject = {
    verified: "Payment Recieved : Order Confirmed for Merchandise !",
    notVerfied:"Payment not confirmed for srijan merchandise"
  }
  const body = {
    verified:`
  Hi, We’ve confirmed your payment for Srijan Merchandise. Your order is now being processed and will be shipped shortly.

  Team Srijan
    `,
    notVerfied:`
  Hi, We noticed your payment for the merchandise order is still pending. Unfortunately, we couldn’t verify the transaction in our records.  

What to do next:  
1. Check if the payment was deducted from your account.  
2. If yes, share a screenshot of the UPI payment confirmation (with transaction ID and timestamp). Reply to this email or contact your Merchandise POC to whom you sent the transaction.

  Team Srijan
    `
  }
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: recipientMail,
    subject: isVerified? subject.verified : subject.notVerfied ,
    text: isVerified? body.verified : body.notVerfied ,
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
//await transporter.sendMail(options);
module.exports = { sendPaymentRecievedMail , sendPaymentVerifiedMail};

