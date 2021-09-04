const nodemailer = require("nodemailer");
require('dotenv').config();

async function sendEmail(email, code){
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
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
  
  }

  module.exports = {
      sendEmail
  }