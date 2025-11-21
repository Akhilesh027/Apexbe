import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: { 
      type: String, 
      unique: true, 
      sparse: true 
    },

    phone: { 
      type: String, 
      unique: true, 
      sparse: true 
    },

    password: String,

    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    walletBalance: {
      type: Number,
      default: 0
    },

    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
