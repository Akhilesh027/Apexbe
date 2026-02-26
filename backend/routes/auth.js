// controllers/googleAuth.js
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
    const { credential, referralCode } = req.body; // ✅ accept referralCode also
    if (!credential) return res.status(400).json({ error: "Missing credential" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload?.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "No email from Google" });

    let user = await User.findOne({ email });

    // ✅ first time google signup
    if (!user) {
      // optional: if your User schema requires password, create a random one
      const randomPassword = crypto.randomBytes(24).toString("hex");

      user = await User.create({
        name: payload?.name || "",
        email,
        password: randomPassword, // if not required in schema, you can remove
        // picture: payload?.picture || "",
        // googleId: payload?.sub || "",
        // ✅ store referral link if your model supports
        referredBy: referralCode || undefined,
      });
    } else {
      // ✅ if user exists but doesn't have name, update it once
      if (!user.name && payload?.name) {
        user.name = payload.name;
        await user.save();
      }
    }

    const token = signToken(user);

    // ✅ cookie (if you use cookie-parser + https in prod)
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
        name: user.name || "",
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