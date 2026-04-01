// utils/mailer.js
import nodemailer from "nodemailer";

// Environment variables with defaults
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

// Verify in dev
if (process.env.NODE_ENV !== "production") {
  transporter
    .verify()
    .then(() => console.log("✅ SMTP Verified: Ready to send emails"))
    .catch((err) => console.error("❌ SMTP Verify Failed:", err?.message || err));
}

// Helper: format INR
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n || 0));

// Helper: prettify status
const pretty = (s = "") =>
  String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Helper: generate order tracking link
const orderLink = (orderId) => `${FRONTEND_BASE_URL}/my-orders/${orderId}`;

// ------------------------------
// Email layout helpers (header/footer)
// ------------------------------
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #0B1F3A 0%, #1E3A5F 100%); padding: 20px 0; text-align: center;">
    <img src="https://apexbee.in/logo.png" alt="ApexBee" style="max-width: 150px; height: auto;" />
    <h1 style="color: #F5B400; margin: 10px 0 0;">ApexBee Store</h1>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="margin: 0 0 8px; color: #475569;">© ${new Date().getFullYear()} ApexBee Store. All rights reserved.</p>
    <p style="margin: 0; font-size: 12px; color: #64748b;">
      <a href="mailto:info@apexbee.in" style="color: #0ea5e9;">info@apexbee.in</a> | 
      <a href="https://apexbee.in" style="color: #0ea5e9;">apexbee.in</a> | 
      +91 12345 67890
    </p>
    <p style="margin: 12px 0 0; font-size: 11px; color: #94a3b8;">This is an automated email, please do not reply directly.</p>
  </div>
`;

// Build a consistent email wrapper
const buildEmailWrapper = (content) => `
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    ${getEmailHeader()}
    <div style="padding: 24px 20px;">
      ${content}
    </div>
    ${getEmailFooter()}
  </div>
`;

// Build a simple line item list (for order details)
const buildOrderDetailsList = (items) => {
  if (!items || items.length === 0) return "";
  const rows = items.map(item => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 0;">${item.name || "Product"}</td>
      <td style="padding: 8px 0; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 8px 0; text-align: right;">${formatINR(item.price || 0)}</td>
      <td style="padding: 8px 0; text-align: right;">${formatINR((item.price || 0) * (item.quantity || 1))}</td>
    </tr>
  `).join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 8px; text-align: left;">Item</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Price</th>
          <th style="padding: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

// Build generic email with title, lines, optional button
function buildTemplate({ title, lines = [], ctaUrl, ctaText, additionalHtml = "" }) {
  const htmlLines = lines.map((l) => `<li style="margin: 6px 0;">${l}</li>`).join("");
  const content = `
    <h2 style="color: #0B1F3A; margin-top: 0;">${title}</h2>
    <ul style="list-style: none; padding-left: 0;">
      ${htmlLines}
    </ul>
    ${additionalHtml}
    ${
      ctaUrl
        ? `<p style="text-align: center; margin: 24px 0;"><a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">${ctaText}</a></p>`
        : ""
    }
  `;
  const text = `${title}\n\n${lines.map((l) => `- ${l.replace(/<[^>]+>/g, "")}`).join("\n")}\n\n${
    ctaUrl ? `${ctaText}: ${ctaUrl}` : ""
  }`;
  return { html: buildEmailWrapper(content), text };
}

// ------------------------------
// Email functions
// ------------------------------

// 1) Order placed
async function sendOrderPlacedEmail({ to, order }) {
  const id = order?.orderNumber || String(order?._id || "");
  const items = order?.orderItems || [];
  const itemSummary = buildOrderDetailsList(items);

  const { html, text } = buildTemplate({
    title: "🎉 Your order has been placed successfully!",
    lines: [
      `Order ID: <strong>${id}</strong>`,
      `Order Status: <strong>${pretty(order?.orderStatus?.currentStatus)}</strong>`,
      `Payment Method: <strong>${pretty(order?.paymentDetails?.method)}</strong>`,
      `Payment Status: <strong>${pretty(order?.paymentDetails?.status)}</strong>`,
      `Total Amount: <strong>${formatINR(order?.orderSummary?.total)}</strong>`,
    ],
    additionalHtml: items.length ? `
      <h3 style="font-size: 18px; margin: 20px 0 8px;">Order Items</h3>
      ${itemSummary}
    ` : "",
    ctaUrl: orderLink(order?._id),
    ctaText: "Track your order",
  });

  return sendMail({
    to,
    subject: `🎉 Order Confirmed (${id}) – Thank you for shopping with ApexBee!`,
    html,
    text,
  });
}

// 2) Order status changed
async function sendOrderStatusChangedEmail({ to, order, previousStatus, newStatus, note }) {
  const id = order?.orderNumber || String(order?._id || "");
  const { html, text } = buildTemplate({
    title: "📦 Order status updated",
    lines: [
      `Order ID: <strong>${id}</strong>`,
      `Previous status: <strong>${pretty(previousStatus)}</strong>`,
      `Current status: <strong>${pretty(newStatus)}</strong>`,
      `Payment status: <strong>${pretty(order?.paymentDetails?.status)}</strong>`,
      note ? `Note: ${note}` : null,
      `Total: <strong>${formatINR(order?.orderSummary?.total)}</strong>`,
    ].filter(Boolean),
    ctaUrl: orderLink(order?._id),
    ctaText: "Track your order",
  });

  return sendMail({
    to,
    subject: `📦 Order ${id} – Status updated to ${pretty(newStatus)}`,
    html,
    text,
  });
}

// 3) Payment status changed
async function sendPaymentStatusChangedEmail({ to, order, previousStatus, newStatus, note }) {
  const id = order?.orderNumber || String(order?._id || "");
  const amount = order?.paymentDetails?.amount ?? order?.orderSummary?.total;
  const { html, text } = buildTemplate({
    title: "💳 Payment status updated",
    lines: [
      `Order ID: <strong>${id}</strong>`,
      `Previous status: <strong>${pretty(previousStatus)}</strong>`,
      `Current status: <strong>${pretty(newStatus)}</strong>`,
      `Order status: <strong>${pretty(order?.orderStatus?.currentStatus)}</strong>`,
      note ? `Note: ${note}` : null,
      `Amount: <strong>${formatINR(amount)}</strong>`,
    ].filter(Boolean),
    ctaUrl: orderLink(order?._id),
    ctaText: "View order details",
  });

  return sendMail({
    to,
    subject: `💳 Payment ${id} – ${pretty(newStatus)}`,
    html,
    text,
  });
}

// 4) Reset password
async function sendResetPasswordEmail({ to, resetUrl }) {
  const { html, text } = buildTemplate({
    title: "🔐 Reset your ApexBee password",
    lines: [
      "We received a request to reset your password.",
      "Click the button below to set a new password. This link expires in 15 minutes.",
    ],
    ctaUrl: resetUrl,
    ctaText: "Reset Password",
  });

  return sendMail({
    to,
    subject: "ApexBee: Reset your password",
    html,
    text,
  });
}

// 5) Send invoice via email (attached PDF)
async function sendInvoiceEmail({ to, order, pdfBuffer, filename }) {
  const id = order?.orderNumber || String(order?._id || "");
  const total = formatINR(order?.orderSummary?.total || 0);
  const date = new Date(order?.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const { html, text } = buildTemplate({
    title: "📄 Your Invoice is ready",
    lines: [
      `Order #${id}`,
      `Date: ${date}`,
      `Total: ${total}`,
      "Please find your invoice attached to this email.",
    ],
    ctaUrl: orderLink(order?._id),
    ctaText: "View order details",
  });

  return sendMail({
    to,
    subject: `ApexBee: Invoice for order ${id}`,
    html,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

// Generic sendMail (used internally, also exported)
async function sendMail({ to, subject, html, text, attachments = [] }) {
  if (!to) throw new Error("Missing recipient email");

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
    attachments,
    replyTo: fromEmail,
    headers: { "X-App": "ApexBee" },
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

export {
  sendMail,
  sendResetPasswordEmail,
  sendOrderPlacedEmail,
  sendOrderStatusChangedEmail,
  sendPaymentStatusChangedEmail,
  sendInvoiceEmail,
};