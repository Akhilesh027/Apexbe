import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    accountHolderName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifsc: { type: String, required: true, trim: true },
    upiId: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.BankDetails || mongoose.model("BankDetails", bankDetailsSchema);
