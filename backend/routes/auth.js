import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body; // Google ID token
    if (!credential) return res.status(400).json({ error: "Missing credential" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // payload: { email, name, picture, sub, email_verified, ... }

    const email = (payload?.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "No email from Google" });

    // ✅ find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: payload?.name || "",
        email,
        // phone optional (Google won’t give phone)
        // You can also store googleId: payload.sub
        // referralCode generate if your system needs it
      });
    }

    // ✅ Issue your JWT
    const token = signToken(user);

    // (Recommended) set cookie instead of localStorage
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        referralCode: user.referralCode,
        walletBalance: user.walletBalance,
      },
      token, // keep if you still use localStorage
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: "Google auth failed" });
  }
};
export default googleAuth;