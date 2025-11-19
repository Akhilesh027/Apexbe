import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    name: { type: String, required: true, trim: true },

    slug: { type: String, unique: true },

    sku: {
      type: String,
      unique: true,
      required: true,
    },

    price: { type: Number, required: true, min: 0 },

    category: { type: String, required: true },

    subcategory: { type: String, default: "" },

    stock: { type: Number, default: 0 },

    description: { type: String, trim: true },

    image: { type: String, default: "" },

    images: { type: [String], default: [] },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto create slug and SKU
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  }

  // Generate SKU only if not provided
  if (!this.sku) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `PROD-${random}`;
  }

  next();
});

export default mongoose.model("Product", productSchema);
