import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    password: { type: String, select: false },

    dateOfBirth: { type: Date },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
      default: "prefer-not-to-say",
    },

    bio: { type: String, maxlength: 500 },

    avatar: { type: String, default: "" },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    referralLevel: {
      type: Number,
      default: 0, // 0 = root, 1 = direct, 2 = indirect, 3 = sub-indirect
      index: true,
    },

    // ✅ Recommended for "first purchase commission" logic
    firstOrderCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    walletBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // Optional arrays (fast populate / display)
    directReferrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    indirectReferrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    level3Referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],

    // Level-specific counts
    level0Count: { type: Number, default: 0 },
    level1Count: { type: Number, default: 0 },
    level2Count: { type: Number, default: 0 },
    level3Count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Normalize email/phone
userSchema.pre("save", function (next) {
  if (this.email) this.email = String(this.email).trim().toLowerCase();
  if (this.phone) this.phone = String(this.phone).trim();
  next();
});

// ✅ Helper: refresh counts + arrays (Level 1/2/3)
userSchema.methods.updateLevelCounts = async function () {
  const userId = this._id;

  const level1Users = await this.constructor.find({ referredBy: userId }).select("_id");
  const level1Ids = level1Users.map((u) => u._id);

  const level2Users = level1Ids.length
    ? await this.constructor.find({ referredBy: { $in: level1Ids } }).select("_id")
    : [];
  const level2Ids = level2Users.map((u) => u._id);

  const level3Users = level2Ids.length
    ? await this.constructor.find({ referredBy: { $in: level2Ids } }).select("_id")
    : [];
  const level3Ids = level3Users.map((u) => u._id);

  this.level0Count = 1;
  this.level1Count = level1Ids.length;
  this.level2Count = level2Ids.length;
  this.level3Count = level3Ids.length;

  this.directReferrals = level1Ids;
  this.indirectReferrals = level2Ids;
  this.level3Referrals = level3Ids;

  return this.save();
};

// ✅ Helpful indexes for network queries
userSchema.index({ referredBy: 1, createdAt: -1 });
userSchema.index({ referralCode: 1 }); // quick lookup

const User = mongoose.model("User", userSchema);
export default User;