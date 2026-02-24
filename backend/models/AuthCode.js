import mongoose from "mongoose";

const authCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String },         // for OTP
    tokenHash: { type: String },       // for magic link
    purpose: { type: String, enum: ["login"], default: "login" },
    expiresAt: { type: Date, required: true, index: true },
    attemptsLeft: { type: Number, default: 5 },
  },
  { timestamps: true }
);

authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto cleanup

export default mongoose.model("AuthCode", authCodeSchema);