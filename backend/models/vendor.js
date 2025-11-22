import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cell: { type: String, required: true },
  password: { type: String, required: true }, // <- must be here
  status: { type: String, enum: ["PENDING", "APPROVED"], default: "PENDING" },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  subscriptionPlan: {
    name: { type: String, default: "Free" },
    validUntil: Date,
  },
   status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
}, { timestamps: true });

export default mongoose.model("Vendor", vendorSchema);
