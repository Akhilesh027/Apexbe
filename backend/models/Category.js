import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true }, // store image filename or URL
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
