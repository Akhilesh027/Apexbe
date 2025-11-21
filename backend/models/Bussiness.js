import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

    // STEP 1
    businessName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    businessTypes: {
      type: [String],
      default: [],
      enum: ["Retailer", "Wholesaler", "Distributor", "Manufacturer", "Services"]
    },

    industryType: { type: String, required: true },
    registrationType: { type: String, required: true },

    logo: { type: String, default: "" }, // file path

    // STEP 2
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pinCode: { type: String, required: true },

    gstApplicable: { type: Boolean, default: false },
    gstNumber: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Business", businessSchema);
