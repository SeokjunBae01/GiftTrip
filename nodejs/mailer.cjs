// mailer.cjs
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",  // 465:true, 587:false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendGiftTripMail({ to, subject, text, html, attachments }) {
  const fromValue =
    process.env.SMTP_FROM || `GiftTrip <${process.env.SMTP_USER}>`; // ✅ FROM 보정
  const info = await transporter.sendMail({
    from: fromValue,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return info;
}

// 서버 시작 시 SMTP 연결 확인용 (선택)
async function verify() {
  try {
    await transporter.verify();
    console.log("[mailer] SMTP ready");
  } catch (e) {
    console.error("[mailer] verify failed:", e.message);
  }
}

module.exports = { sendGiftTripMail, verify };