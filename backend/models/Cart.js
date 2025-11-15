import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  selectedColor: { type: String, default: "default" },
  vendorId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Cart", CartSchema);
