import mongoose from 'mongoose';

const vendorEarningSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },
  totalEarned: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  withdrawn: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit', 'withdrawal'], required: true },
    amount: Number,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    description: String,
    createdAt: { type: Date, default: Date.now },
  }],
});

export default mongoose.model('VendorEarning', vendorEarningSchema);