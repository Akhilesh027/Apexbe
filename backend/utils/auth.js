import crypto from "crypto";
import jwt from "jsonwebtoken";

export function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // magic link token
}

export function signJwt(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}