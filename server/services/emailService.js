const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wishing Lake of Smiles</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Georgia', serif; background: #020617; color: #F8FAFC; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { font-size: 28px; color: #FDE047; margin: 0; letter-spacing: -0.5px; }
    .header p { color: #94A3B8; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 40px 30px; background: rgba(15,23,42,0.8); border-radius: 12px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.1); }
    .content p { color: #CBD5E1; line-height: 1.7; margin: 0 0 16px; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FDE047, #F59E0B); color: #020617; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #475569; font-size: 12px; padding: 20px 0; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌙 Wishing Lake</h1>
      <p>of Smiles</p>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} Wishing Lake of Smiles. All rights reserved.</p>
      <p>You received this email because you signed up for an account.</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER) {
    logger.warn(`Email not configured. Would have sent to ${to}: ${subject}`);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"Wishing Lake ✨" <noreply@wishinglake.com>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send error: ${err.message}`);
    throw err;
  }
};

exports.sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  return sendEmail({
    to: email,
    subject: '✨ Verify your Wishing Lake account',
    html: baseTemplate(`
      <div class="content">
        <p>Dear <strong style="color:#FDE047">${name}</strong>,</p>
        <p>Welcome to the Wishing Lake of Smiles! Your journey begins with a single drop in the water.</p>
        <p>Please verify your email address to unlock all features and start making wishes.</p>
        <div style="text-align:center">
          <a href="${verifyUrl}" class="button">✉️ Verify My Email</a>
        </div>
        <hr class="divider">
        <p style="font-size:13px;color:#64748B">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
      </div>
    `),
  });
};

exports.sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  return sendEmail({
    to: email,
    subject: '🔑 Reset your Wishing Lake password',
    html: baseTemplate(`
      <div class="content">
        <p>Dear <strong style="color:#FDE047">${name}</strong>,</p>
        <p>We received a request to reset the password for your account. Click the button below to create a new password.</p>
        <div style="text-align:center">
          <a href="${resetUrl}" class="button">🔑 Reset Password</a>
        </div>
        <hr class="divider">
        <p style="font-size:13px;color:#64748B">This link expires in 10 minutes. If you didn't request a password reset, please ignore this email — your account is safe.</p>
      </div>
    `),
  });
};

exports.sendWishFulfilledEmail = async (email, name, wishTitle, fulfillerName) => {
  return sendEmail({
    to: email,
    subject: '🌟 Your wish is being fulfilled!',
    html: baseTemplate(`
      <div class="content">
        <p>Dear <strong style="color:#FDE047">${name}</strong>,</p>
        <p>Magic is real — <strong style="color:#38BDF8">${fulfillerName}</strong> has offered to make your wish come true!</p>
        <p style="background:rgba(251,191,36,0.1);padding:16px;border-radius:8px;border-left:3px solid #FDE047">
          "${wishTitle}"
        </p>
        <p>Log in to review their offer and open a private chat to coordinate.</p>
        <div style="text-align:center">
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">✨ View Fulfillment Offer</a>
        </div>
      </div>
    `),
  });
};
