const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOverdueEmail = async (toEmail, userName, taskTitle) => {
  logger.info("MailService.sendOverdueEmail — started", { toEmail, taskTitle });
  try {
    const result = await transporter.sendMail({
      from: `"Task Manager" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `Overdue Task: "${taskTitle}"`,
      html: `
        <p>Hi ${userName},</p>
        <p>Your task <strong>"${taskTitle}"</strong> was not completed by its deadline.</p>
        <p>Please log in and update its status.</p>
      `,
    });
    logger.info("MailService.sendOverdueEmail — sent", { toEmail, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error("MailService.sendOverdueEmail — failed", { error: err.message, stack: err.stack });
    throw err;
  }
};

exports.sendPasswordResetEmail = async (toEmail, resetURL) => {
  logger.info("MailService.sendPasswordResetEmail — started", { toEmail });
  try {
    const result = await transporter.sendMail({
      from: `"Task Manager" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetURL}" style="display:inline-block;padding:10px 20px;background:#2563EB;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p style="margin-top:12px;color:#6B7280;font-size:13px;">This link expires in 15 minutes. If you did not request this, ignore this email.</p>
      `,
    });
    logger.info("MailService.sendPasswordResetEmail — sent", { toEmail, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error("MailService.sendPasswordResetEmail — failed", { error: err.message, stack: err.stack });
    throw err;
  }
};
