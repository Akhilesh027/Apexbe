import mongoose from "mongoose";
const Store = mongoose.model('Store', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  description: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  isActive: { type: Boolean, default: true },
  openingHours: {
    open: String,
    close: String,
    workingDays: [Number]
  },
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true }));

export default mongoose.model("Store", Store);