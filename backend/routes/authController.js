// controllers/authController.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP

const OTP_TTL_MIN = 10;
const MAX_VERIFY_ATTEMPTS = 8;
const RESEND_COOLDOWN_SEC = 45; // prevent spam resend

const safeOk = (res) =>
  res.json({ success: true, message: "If the email exists, OTP was sent." });

// ✅ POST /api/auth/forgot-password-otp
export const forgotPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: "Email is required." });

    const user = await User.findOne({ email });

    // ✅ Anti-enumeration: always return success
    if (!user) return safeOk(res);

    // ✅ Cooldown to avoid spamming resend
    const lastSentAt = user.resetPasswordOtpLastSentAt
      ? new Date(user.resetPasswordOtpLastSentAt).getTime()
      : 0;

    if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_SEC * 1000) {
      return res.status(429).json({
        success: false,
        error: `Please wait ${RESEND_COOLDOWN_SEC} seconds before requesting a new OTP.`,
      });
    }

    // ✅ Generate and store OTP (hashed)
    const otp = makeOtp();
    user.resetPasswordOtpHash = sha256(otp);
    user.resetPasswordOtpExpiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
    user.resetPasswordOtpVerified = false;
    user.resetPasswordOtpAttempts = 0; // attempts for verify
    user.resetPasswordOtpLastSentAt = new Date(); // resend cooldown
    await user.save();

    // ✅ Send email
    const info = await sendMail({
      to: email,
      subject: "Your ApexBee password reset OTP",
      text: `Your OTP is ${otp}. It expires in ${OTP_TTL_MIN} minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Password Reset OTP</h2>
          <p>Use this OTP to reset your password:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</div>
          <p style="color:#666;font-size:12px">Expires in ${OTP_TTL_MIN} minutes.</p>
          <p style="color:#666;font-size:12px">If you didn’t request this, ignore this email.</p>
        </div>
      `,
    });

    // ✅ helpful debug logs
    console.log("✅ OTP email sent:", {
      to: email,
      accepted: info?.accepted,
      rejected: info?.rejected,
      messageId: info?.messageId,
      response: info?.response,
    });

    return safeOk(res);
  } catch (err) {
    console.error("forgotPasswordOtp error:", err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
};

// ✅ POST /api/auth/verify-reset-otp
export const verifyResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });
    // keep response generic
    if (!user) return res.status(400).json({ success: false, error: "Invalid OTP." });

    if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ success: false, error: "OTP not requested." });
    }

    if (user.resetPasswordOtpAttempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ success: false, error: "Too many attempts. Try again later." });
    }

    // increment attempt (verify-only)
    user.resetPasswordOtpAttempts += 1;

    // expired?
    if (new Date(user.resetPasswordOtpExpiresAt) <= new Date()) {
      await user.save();
      return res.status(400).json({ success: false, error: "OTP expired. Please request again." });
    }

    // wrong otp?
    if (sha256(otp) !== user.resetPasswordOtpHash) {
      await user.save();
      return res.status(400).json({ success: false, error: "Invalid OTP." });
    }

    // correct
    user.resetPasswordOtpVerified = true;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    return res.json({ success: true, message: "OTP verified." });
  } catch (err) {
    console.error("verifyResetOtp error:", err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
};

// ✅ POST /api/auth/reset-password-otp
export const resetPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: "Email and newPassword are required." });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, error: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: "Invalid request." });

    if (!user.resetPasswordOtpVerified) {
      return res.status(400).json({ success: false, error: "OTP not verified." });
    }

    // ensure not expired at reset time
    if (!user.resetPasswordOtpExpiresAt || new Date(user.resetPasswordOtpExpiresAt) <= new Date()) {
      return res.status(400).json({ success: false, error: "OTP expired. Please request again." });
    }

    // hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // clear otp fields
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpiresAt = undefined;
    user.resetPasswordOtpVerified = false;
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSentAt = undefined;

    await user.save();

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("resetPasswordOtp error:", err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
};