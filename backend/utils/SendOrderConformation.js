import { sendMail } from "./mailer.js";

function formatMoney(n) {
  const num = Number(n || 0);
  return `₹${num.toFixed(2)}`;
}

function formatAddress(addr) {
  if (!addr) return "—";
  const parts = [
    addr.address,
    addr.city,
    addr.state,
    addr.pincode ? `- ${addr.pincode}` : "",
  ].filter(Boolean);
  return parts.join(", ").replace(", -", " -");
}

async function sendOrderConfirmation(order, userDoc) {
  const to = userDoc?.email || order?.userDetails?.email;
  if (!to) return { sent: false, reason: "no_email" };

  const method = order?.paymentDetails?.method || "cod";
  const paymentStatus = order?.paymentDetails?.status || "pending";
  const orderNumber = order?.orderNumber || order?._id;
  const total = order?.orderSummary?.total ?? 0;
  const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const shippingAddress = order?.shippingAddress;

  const frontendUrl = process.env.FRONTEND_URL || "https://apexbee.in";
  const ordersUrl = `${frontendUrl}/orders`;

  const isUPI = method === "upi";
  const confirmed =
    paymentStatus === "completed" || method === "cod" || method === "wallet" || method === "card";

  const subject = confirmed
    ? `✅ Order Confirmed - ${orderNumber}`
    : isUPI
    ? `⏳ Order Placed (UPI Verification Pending) - ${orderNumber}`
    : `🧾 Order Placed - ${orderNumber}`;

  const statusLine = confirmed
    ? "Your order is confirmed and being processed."
    : isUPI
    ? "We received your order. Your UPI payment will be verified soon."
    : "We received your order and will update you soon.";

  const itemsHtml = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;">${it.name || "Item"}</div>
          <div style="color:#666;font-size:12px;">
            Qty: ${it.quantity || 1}${it.color ? ` • Color: ${it.color}` : ""}${it.size ? ` • Size: ${it.size}` : ""}
          </div>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">
          ${formatMoney((it.price || 0) * (it.quantity || 1))}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;">
    <h2 style="margin:0 0 10px;">${confirmed ? "✅ Order Confirmed" : "🧾 Order Placed"}</h2>
    <p style="margin:0 0 14px;color:#333;">${statusLine}</p>

    <div style="background:#f7f7f7;border:1px solid #eee;border-radius:10px;padding:14px;margin:14px 0;">
      <div><b>Order:</b> ${orderNumber}</div>
      <div><b>Payment:</b> ${String(method).toUpperCase()} (${paymentStatus})</div>
      <div><b>Total:</b> ${formatMoney(total)}</div>
    </div>

    <h3 style="margin:18px 0 8px;">Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemsHtml || `<tr><td>No items</td></tr>`}
      <tr>
        <td style="padding:10px 0;font-weight:700;">Grand Total</td>
        <td style="padding:10px 0;text-align:right;font-weight:700;">${formatMoney(total)}</td>
      </tr>
    </table>

    <h3 style="margin:18px 0 8px;">Delivery Address</h3>
    <p style="margin:0;color:#333;">${formatAddress(shippingAddress)}</p>

    <div style="margin:18px 0;">
      <a href="${ordersUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">
        View My Orders
      </a>
    </div>

    <p style="color:#777;font-size:12px;margin-top:22px;">
      If you didn’t place this order, please contact support.
    </p>
  </div>
  `;

  const text = `Order: ${orderNumber}
Status: ${statusLine}
Payment: ${method} (${paymentStatus})
Total: ${formatMoney(total)}
Address: ${formatAddress(shippingAddress)}
My Orders: ${ordersUrl}`;

  await sendMail({ to, subject, html, text });

  return { sent: true };
}

export default sendOrderConfirmation;