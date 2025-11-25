import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        vendorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Vendor", 
            required: true 
        },

        // --- PRODUCT DETAILS ---
        itemType: {
            type: String,
            enum: ['product', 'service'], // Added enum for clarity
            default: 'product',
        },
        category: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Category",
            required: true // Category should generally be required
        },
        // Note: subcategory is stored as a string ID which references the subdocument _id inside the Category model
        subcategory: { 
            type: String, 
            required: false 
        },
        itemName: {
            type: String,
            required: true
        },
        
        gstRate: {
            type: Number,
            default: 0
        },
        description: String,

        // --- IMAGES ---
        images: [String],

        slug: {
            type: String,
            unique: true,
            sparse: true,
        },

        // --- STOCK/INVENTORY DETAILS ---
        skuCode: { 
            type: String, 
            required: true, 
            unique: true 
        },
        measuringUnit: String,
        hsnCode: String,
        godown: String,
        openStock: {
            type: Number,
            default: 0
        },
        asOnDate: String,

        // --- PRICE DETAILS ---
        userPrice: { 
            type: Number, 
            default: 0 
        }, // Corresponds to MRP
        discount: {
            type: Number,
            default: 0
        },
        afterDiscount: {
            type: Number,
            default: 0
        }, // Final price paid by customer (Price with GST - Discount)
        
        // 🌟 UPDATED: Commission is calculated/set by the Admin
        commission: {
            type: Number,
            default: 0 // Initialized to 0 by default, updated by Admin
        },
        // This 'finalAmount' is the amount the vendor calculated (AfterDiscount), before Admin commission is deducted.
        finalAmount: {
            type: Number,
            default: 0
        }, 
        priceType: {
            type: String,
            enum: ['product-wise', 'order-wise'],
            default: 'product-wise'
        },

        // 🌟 NEW FIELD: Product approval status
        status: {
            type: String,
            enum: ['Pending', 'Approved','Vendor Confirmed','Vendor Rejected','Admin Approved','Admin Rejected', 'Rejected', 'Draft'],
            default: 'Pending', // New products start as Pending
            required: true
        },
    },
    { 
        timestamps: true 
    }
);

export default mongoose.model("Products", productSchema);