// utils/mailer.js
import nodemailer from "nodemailer";

const host = (process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, ""); // ✅ remove spaces

const fromName = (process.env.FROM_NAME || "ApexBee").trim();
let fromEmail = (process.env.FROM_EMAIL || smtpUser || "").trim();

// ✅ Guard: if user mistakenly put "Name <email>" in FROM_EMAIL
if (fromEmail.includes("<") || fromEmail.includes(">")) {
  console.warn(
    "⚠️ FROM_EMAIL should be only an email (not 'Name <email>'). Using SMTP_USER instead."
  );
  fromEmail = smtpUser;
}

console.log("📨 SMTP CONFIG:", {
  host: host || "(missing)",
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  user: smtpUser ? "(set)" : "(missing)",
  pass: smtpPass ? "(set)" : "(missing)",
  fromEmail: fromEmail || "(missing)",
});

if (!host) throw new Error("SMTP_HOST missing in .env");
if (!smtpUser) throw new Error("SMTP_USER missing in .env");
if (!smtpPass) throw new Error("SMTP_PASS missing in .env");
if (!fromEmail) throw new Error("FROM_EMAIL missing in .env (or SMTP_USER missing)");

const transporter = nodemailer.createTransport({
  host,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  pool: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// ✅ Verify in dev (recommended)
if (process.env.NODE_ENV !== "production") {
  transporter
    .verify()
    .then(() => console.log("✅ SMTP Verified: Ready to send emails"))
    .catch((err) => console.error("❌ SMTP Verify Failed:", err?.message || err));
}

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error("Missing recipient email");

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
    replyTo: fromEmail,
  });

  // ✅ super important logs to debug "sent but not received"
  console.log("✅ Mail send result:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    envelope: info.envelope,
  });

  return info;
}

async function sendResetPasswordEmail({ to, resetUrl }) {
  const subject = "Reset your ApexBee password";
  const text = `Reset your password using this link (expires soon): ${resetUrl}`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Password Reset</h2>
    <p>We received a request to reset your password.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px">
        Reset Password
      </a>
    </p>
    <p style="color:#666;font-size:12px">This link expires in 15 minutes.</p>
    <p style="color:#666;font-size:12px">If you didn’t request this, ignore this email.</p>
  </div>`;

  return sendMail({ to, subject, html, text });
}

export { sendMail, sendResetPasswordEmail };