import mongoose from "mongoose";

// Define the schema for Subcategories as an embedded subdocument
const subcategorySchema = new mongoose.Schema({
    // Name of the subcategory (e.g., "T-Shirts", "Mobiles")
    name: { 
        type: String, 
        required: true,
        trim: true,
        // While not strictly enforced by Mongoose on embedded docs, 
        // this constraint should be enforced in the Express route logic 
        // to prevent naming conflicts across *all* subcategories.
        // For simplicity in the schema itself, we rely on validation logic.
    },
    // Optional: Add a field for subcategory-specific images or descriptions
    // image: { type: String }, 
}, { 
    _id: true, // Crucial: Ensures each subcategory gets a unique ObjectId for referencing
    timestamps: true // Optional: Tracks creation/update time for the subcategory itself
}); 

const categorySchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            unique: true 
        },
        image: { 
            type: String, 
            required: true 
        }, // store image filename or URL
        
        // NEW FIELD: Embed the subcategories array
        subcategories: [subcategorySchema] 
    },
    { timestamps: true }
);

export default mongoose.model("Category", categorySchema);