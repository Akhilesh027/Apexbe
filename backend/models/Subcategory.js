import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Subcategory", SubcategorySchema);
