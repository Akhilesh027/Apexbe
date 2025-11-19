import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'credited'],
    default: 'pending'
  },
  rewardAmount: {
    type: Number,
    default: 100
  },
  completedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('Referral', referralSchema);