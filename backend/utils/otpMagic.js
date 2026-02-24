import crypto from "crypto";

export const hashValue = (v) =>
  crypto.createHash("sha256").update(String(v)).digest("hex");

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const generateToken = () =>
  crypto.randomBytes(32).toString("hex");