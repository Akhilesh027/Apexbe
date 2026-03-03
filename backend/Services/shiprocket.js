import axios from "axios";

const BASE = process.env.SHIPROCKET_BASE || "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiry = 0; // ms timestamp

async function getToken() {
  // reuse cached token for ~8 hours (shiprocket tokens usually last a while)
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const email = (process.env.SHIPROCKET_EMAIL || "").trim();
  const password = (process.env.SHIPROCKET_PASSWORD || "").trim();

  if (!email || !password) throw new Error("Shiprocket creds missing in .env");

  const res = await axios.post(`${BASE}/auth/login`, { email, password });
  const token = res.data?.token;

  if (!token) throw new Error("Shiprocket token not received");

  cachedToken = token;
  tokenExpiry = Date.now() + 1000 * 60 * 60 * 8; // 8 hrs cache (safe)
  return token;
}

async function shiprocketRequest(method, url, data) {
  const token = await getToken();
  return axios({
    method,
    url: `${BASE}${url}`,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// 1) Create order in shiprocket
export async function createShiprocketOrder(payload) {
  const res = await shiprocketRequest("POST", "/orders/create/adhoc", payload);
  return res.data;
}

// 2) Track shipment
export async function trackShipment(shipmentIdOrAwb) {
  // Shiprocket has tracking endpoints; you can track by shipment_id or AWB.
  // Common: /courier/track/shipment/{shipment_id}
  const res = await shiprocketRequest("GET", `/courier/track/shipment/${shipmentIdOrAwb}`);
  return res.data;
}

// 3) Generate label/invoice (optional)
export async function generateLabel(shipmentIds = []) {
  const res = await shiprocketRequest("POST", "/courier/generate/label", {
    shipment_id: shipmentIds,
  });
  return res.data;
}

export async function generateInvoice(shipmentIds = []) {
  const res = await shiprocketRequest("POST", "/courier/generate/invoice", {
    shipment_id: shipmentIds,
  });
  return res.data;
}