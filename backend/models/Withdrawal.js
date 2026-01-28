import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },

    referenceId: { type: String, default: "" },
    rejectReason: { type: String, default: "" },

    processedAt: { type: Date, default: null },

    // snapshot (so later user can't change bank and affect old withdrawal)
    bankSnapshot: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
