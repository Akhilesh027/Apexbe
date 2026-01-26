import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cell: { type: String, required: true, trim: true },
    password: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
      index: true,
    },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true, index: true }, // ✅ pincode
      country: { type: String, default: "India" },
    },

    subscriptionPlan: {
      name: { type: String, default: "Free" },
      validUntil: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
