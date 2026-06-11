import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['bank', 'upi', 'paypal'],
    required: true,
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    accountName: String,
  },
  upiId: String,
  adminNote: String,
  processedAt: Date,
}, { timestamps: true });

export default mongoose.model('WithdrawalRequest', withdrawalRequestSchema);