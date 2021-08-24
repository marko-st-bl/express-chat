const nodemailer = require("nodemailer");
require('dotenv').config();

console.log(process.env.MAIL_USER);

async function sendEmail(email, code){
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER, // generated ethereal user
        pass: process.env.MAIL_PASS, // generated ethereal password
      },
    });
  
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: 'SNI 👻', // sender address
      to: email, // list of receivers
      subject: "Verification Token ✔", // Subject line
      text: "CODE: " + code, // plain text body 
    });
  
    console.log("Email sent: %s", info.messageId);
  
    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }

  module.exports = {
      sendEmail
  }