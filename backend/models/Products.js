import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

    // PRODUCT DETAILS
    itemType: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    itemName: String,
    salesPrice: Number,
    taxOption: String,
    gstRate: Number,
    description: String,

    // IMAGES (local paths)
    images: [String],
slug: {
  type: String,
  unique: true,
  sparse: true
},
    // STOCK DETAILS
    skuCode: { type: String, unique: true },
    measuringUnit: String,
    hsnCode: String,
    godown: String,
    openStock: Number,
    asOnDate: String,

    // PRICE DETAILS
    userPrice: Number,         // User given price (sales price)
    discount: Number,          // User given discount
    afterDiscount: Number,     // auto-calculated
    commission: Number,        // auto-calculated
    finalAmount: Number,       // auto-calculated
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
