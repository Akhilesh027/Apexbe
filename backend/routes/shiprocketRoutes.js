import express from "express";
import { createShiprocketOrder, trackShipment, generateLabel, generateInvoice } from "../Services/shiprocket.js";
import Order from "../models/Order.js"; // adjust path

const router = express.Router();

// Admin: create shipment for an order
router.post("/create-shipment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.shiprocket?.shipment_id) {
      return res.json({ success: true, message: "Shipment already created", data: order.shiprocket });
    }

    // ✅ Build Shiprocket payload from your DB order
    const payload = {
      order_id: order.orderNumber || String(order._id),
      order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
      pickup_location: "Primary", // must match Shiprocket pickup name in dashboard
      billing_customer_name: order.address?.name || order.userName || "Customer",
      billing_last_name: "",
      billing_address: order.address?.line1 || "",
      billing_address_2: order.address?.line2 || "",
      billing_city: order.address?.city || "",
      billing_pincode: String(order.address?.pincode || ""),
      billing_state: order.address?.state || "",
      billing_country: "India",
      billing_email: order.email || "",
      billing_phone: String(order.phone || ""),
      shipping_is_billing: true,

      order_items: (order.items || []).map((it) => ({
        name: it.name,
        sku: it.sku || it.productId || "SKU",
        units: Number(it.qty || 1),
        selling_price: Number(it.price || 0),
        discount: Number(it.discount || 0),
        tax: Number(it.tax || 0),
        hsn: it.hsn || "",
      })),

      payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: Number(order.subTotal || order.total || 0),
      length: Number(order.box?.length || 10),
      breadth: Number(order.box?.breadth || 10),
      height: Number(order.box?.height || 5),
      weight: Number(order.box?.weight || 0.5),
    };

    const sr = await createShiprocketOrder(payload);

    // ✅ store shiprocket result in DB
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          shiprocket: {
            order_id: sr.order_id,
            shipment_id: sr.shipment_id,
            awb_code: sr.awb_code,
            courier_company_id: sr.courier_company_id,
            courier_name: sr.courier_name,
            status: "CREATED",
            raw: sr,
          },
        },
      }
    );

    return res.json({ success: true, message: "Shipment created", data: sr });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Shiprocket error" });
  }
});

router.get("/track/:shipmentId", async (req, res) => {
  try {
    const data = await trackShipment(req.params.shipmentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Track failed" });
  }
});

router.post("/label", async (req, res) => {
  try {
    const { shipmentIds } = req.body;
    const data = await generateLabel(shipmentIds || []);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Label failed" });
  }
});

router.post("/invoice", async (req, res) => {
  try {
    const { shipmentIds } = req.body;
    const data = await generateInvoice(shipmentIds || []);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Invoice failed" });
  }
});

export default router;