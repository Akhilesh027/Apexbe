import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String },
  phone: { type: String },
  pincode: { type: String },
  city: { type: String },
  state: { type: String },
  address: { type: String },
}, { timestamps: true });

export default mongoose.model("Address", AddressSchema);
