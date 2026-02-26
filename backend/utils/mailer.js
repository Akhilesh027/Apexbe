// utils/mailer.js
import nodemailer from "nodemailer";

const host = (process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");

const fromName = (process.env.FROM_NAME || "ApexBee").trim();
let fromEmail = (process.env.FROM_EMAIL || smtpUser || "").trim();

const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || "http://localhost:5173").trim();

if (fromEmail.includes("<") || fromEmail.includes(">")) {
  console.warn("⚠️ FROM_EMAIL should be only an email. Using SMTP_USER instead.");
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
  auth: { user: smtpUser, pass: smtpPass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// ✅ Verify in dev
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
    headers: {
      "X-App": "ApexBee",
    },
  });

  console.log("✅ Mail send result:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    envelope: info.envelope,
  });

  return info;
}

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n || 0));

const pretty = (s = "") =>
  String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const orderLink = (orderId) => `${FRONTEND_BASE_URL}/orders/${orderId}`;

function buildTemplate({ title, lines = [], ctaUrl, ctaText }) {
  const htmlLines = lines.map((l) => `<li>${l}</li>`).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>${title}</h2>
      <ul>${htmlLines}</ul>
      ${
        ctaUrl
          ? `<p><a href="${ctaUrl}" style="display:inline-block;padding:10px 14px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px">${ctaText}</a></p>`
          : ""
      }
      <p style="color:#666;font-size:12px">If you didn’t request this, ignore this email.</p>
    </div>
  `;

  const text = `${title}\n\n${lines.map((l) => `- ${l.replace(/<[^>]+>/g, "")}`).join("\n")}\n\n${
    ctaUrl ? `${ctaText}: ${ctaUrl}` : ""
  }`;

  return { html, text };
}

// ✅ 1) Order placed email
async function sendOrderPlacedEmail({ to, order }) {
  const id = order?.orderNumber || String(order?._id || "");
  const { html, text } = buildTemplate({
    title: "Your order has been placed ✅",
    lines: [
      `Order ID: <b>${id}</b>`,
      `Order Status: <b>${pretty(order?.orderStatus?.currentStatus)}</b>`,
      `Payment Method: <b>${pretty(order?.paymentDetails?.method)}</b>`,
      `Payment Status: <b>${pretty(order?.paymentDetails?.status)}</b>`,
      `Total: <b>${formatINR(order?.orderSummary?.total)}</b>`,
    ],
    ctaUrl: orderLink(order?._id),
    ctaText: "Track Order",
  });

  return sendMail({
    to,
    subject: `ApexBee: Order placed (${id})`,
    html,
    text,
  });
}

// ✅ 2) Order status changed email
async function sendOrderStatusChangedEmail({ to, order, previousStatus, newStatus, note }) {
  const id = order?.orderNumber || String(order?._id || "");
  const { html, text } = buildTemplate({
    title: "Order status updated",
    lines: [
      `Order ID: <b>${id}</b>`,
      `Previous: <b>${pretty(previousStatus)}</b>`,
      `Current: <b>${pretty(newStatus)}</b>`,
      `Payment Status: <b>${pretty(order?.paymentDetails?.status)}</b>`,
      note ? `Note: ${note}` : null,
      `Total: <b>${formatINR(order?.orderSummary?.total)}</b>`,
    ].filter(Boolean),
    ctaUrl: orderLink(order?._id),
    ctaText: "Track Order",
  });

  return sendMail({
    to,
    subject: `ApexBee: Order ${id} → ${pretty(newStatus)}`,
    html,
    text,
  });
}

// ✅ 3) Payment status changed email
async function sendPaymentStatusChangedEmail({ to, order, previousStatus, newStatus, note }) {
  const id = order?.orderNumber || String(order?._id || "");
  const amount = order?.paymentDetails?.amount ?? order?.orderSummary?.total;

  const { html, text } = buildTemplate({
    title: "Payment status updated",
    lines: [
      `Order ID: <b>${id}</b>`,
      `Previous: <b>${pretty(previousStatus)}</b>`,
      `Current: <b>${pretty(newStatus)}</b>`,
      `Order Status: <b>${pretty(order?.orderStatus?.currentStatus)}</b>`,
      note ? `Note: ${note}` : null,
      `Amount: <b>${formatINR(amount)}</b>`,
    ].filter(Boolean),
    ctaUrl: orderLink(order?._id),
    ctaText: "View Order",
  });

  return sendMail({
    to,
    subject: `ApexBee: Payment ${id} → ${pretty(newStatus)}`,
    html,
    text,
  });
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

export {
  sendMail,
  sendResetPasswordEmail,
  sendOrderPlacedEmail,
  sendOrderStatusChangedEmail,
  sendPaymentStatusChangedEmail,
};