import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

    // PRODUCT DETAILS
    itemType: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subcategory: { type: String, required: false},
    itemName: String,
    salesPrice: Number,
    gstRate: Number,
    description: String,

    // IMAGES (local paths)
    images: [String],

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

 skuCode: { type: String, required: true, unique: true },

    measuringUnit: String,
    hsnCode: String,
    godown: String,
    openStock: Number,
    asOnDate: String,

    // PRICE DETAILS
    userPrice: Number,
    discount: Number,
    afterDiscount: Number,
    commission: Number,
    finalAmount: Number,
    priceType: String,
  },
  { timestamps: true }
);

export default mongoose.model("Products", productSchema);
