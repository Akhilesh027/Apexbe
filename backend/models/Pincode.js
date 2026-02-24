import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    estimatedDays: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

const Pincode = mongoose.model("Pincode", pincodeSchema);
export default Pincode;