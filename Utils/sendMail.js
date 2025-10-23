const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

require("dotenv").config();

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;
  //get path to the email template file
  const templatePath = path.join(__dirname, "../Mails", template);
  //render template with ejs
  const html = await ejs.renderFile(templatePath, data);
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
