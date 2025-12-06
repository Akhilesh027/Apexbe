import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";
import PDFDocument from "pdfkit";
import Vendor from "./models/vendor.js";
import Products from "./models/Products.js";
import Cart from "./models/Cart.js";
import Address from "./models/Address.js";
import Order from "./models/Order.js";
import Wishlist from "./models/Wishlist.js";
import Category from "./models/Category.js";
import Subcategory from "./models/Subcategory.js";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

import dotenv from "dotenv";
import Referral from "./models/Referral.js";
import Bussiness from "./models/Bussiness.js";
import Form from "./models/Form.js";
dotenv.config();
cloudinary.api.ping()
  .then(() => {
    console.log("✅ Cloudinary Connected Successfully!");
  })
  .catch((err) => {
    console.log("❌ Cloudinary Connection Failed:", err.message);
  });
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error("DB Error:", err));

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      cell,
      password,
      confirmPassword,
      address = {}, // street, city, state, zip, country
    } = req.body;

    // Validate required fields
    if (!name || !email || !cell || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if email already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new vendor
    const vendor = new Vendor({
      name,
      email,
      cell,
      password: hashedPassword,
      address: {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zip: address.zip || "",
        country: address.country || "",
      },
      status: "pending", // default status
    });

    await vendor.save();

    return res.json({ message: "Registration successful", vendorId: vendor._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
});
// ----------------------
// LOGIN VENDOR
// ----------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find vendor by email and include password
    const vendor = await Vendor.findOne({ email }).select("+password");
    if (!vendor) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Ensure password exists
    if (!vendor.password) {
      return res.status(400).json({ error: "Password not set for this account" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: vendor._id, email: vendor.email },
      "BANNU9",
      { expiresIn: "7d" }
    );

    // Return vendor details including cell, address, status, and subscriptionPlan
    return res.json({
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        cell: vendor.cell,
        status: vendor.status,
        address: vendor.address, // street, city, state, zip, country
        subscriptionPlan: vendor.subscriptionPlan || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
});
// GET /api/vendor/:vendorId
app.get("/api/vendor/:vendorId", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId).select(
      "name email cell status address subscriptionPlan"
    );

    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    res.json({ vendor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: String,
    name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: ''
  },
      referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
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

// ---------------------------------------------
// 🔐 TOKEN CREATOR
// ---------------------------------------------

// Utility Functions
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email }, 
    process.env.JWT_SECRET || 'BANNU9', 
    { expiresIn: '30d' }
  );
};
// Auth Middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BANNU9');
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found for token');
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Add user to request
    req.user = user;
    console.log('Authenticated user:', user._id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Process Referral Function
const processReferral = async (referredUserId, referralCode) => {
  try {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      console.log('Referrer not found for code:', referralCode);
      return;
    }

    // Create referral record
    const referral = await Referral.create({
      referrer: referrer._id,
      referredUser: referredUserId,
      referralCode,
      status: 'pending',
      rewardAmount: 50
    });

    // Update referred user's record
    await User.findByIdAndUpdate(referredUserId, {
      referredBy: referrer._id
    });

    console.log(`Referral created: ${referrer._id} -> ${referredUserId}`);
    return referral;
  } catch (error) {
    console.error('Error processing referral:', error);
  }
};

// Complete Referral Function (call this when user makes purchase)
const completeReferral = async (userId, orderAmount) => {
  try {
    const referral = await Referral.findOne({ 
      referredUser: userId, 
      status: 'pending' 
    });

    if (!referral) {
      console.log('No pending referral found for user:', userId);
      return;
    }

    // Update referral status to completed
    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();

    // Credit reward to referrer
    await User.findByIdAndUpdate(referral.referrer, {
      $inc: { 
        walletBalance: referral.rewardAmount,
        totalEarnings: referral.rewardAmount
      }
    });

    // Update referral status to credited
    referral.status = 'credited';
    await referral.save();

    console.log(`Referral completed and credited: ${referral._id}`);
    return referral;
  } catch (error) {
    console.error('Error completing referral:', error);
  }
};
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(400).json({
        error: "Email or Phone already registered",
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const userReferralCode = generateReferralCode();

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPass,
      referralCode: userReferralCode,
    });

    // Process referral if referral code provided
    if (referralCode) {
      await processReferral(newUser._id, referralCode);
    }

    res.json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        referralCode: newUser.referralCode
      },
      token: createToken(newUser),
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance
      },
      token: createToken(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/referrals/code", auth, async (req, res) => {
  try {
    console.log('Getting referral code for user:', req.user?._id);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.referralCode) {
      user.referralCode = generateReferralCode();
      await user.save();
    }

    res.json({
      referralCode: user.referralCode,
      referralLink: `https://apexbee.in/login?ref=${user.referralCode}`
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});
app.get("/api/referrals/stats", auth, async (req, res) => {
  try {
    console.log('Getting referral stats for user:', req.user?._id);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user._id;

    const totalReferrals = await Referral.countDocuments({ referrer: userId });
    const completedReferrals = await Referral.countDocuments({ 
      referrer: userId, 
      status: 'credited' 
    });
    const pendingReferrals = await Referral.countDocuments({ 
      referrer: userId, 
      status: 'pending' 
    });
    
    const totalEarningsResult = await Referral.aggregate([
      { $match: { referrer: new mongoose.Types.ObjectId(userId), status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);

    const user = await User.findById(userId);

    res.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings: totalEarningsResult[0]?.total || 0,
      walletBalance: user?.walletBalance || 0
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});
app.get("/api/referrals/history", auth, async (req, res) => {
  try {
    console.log('Getting referral history for user:', req.user?._id);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find({ referrer: userId })
      .populate('referredUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments({ referrer: userId });

    res.json({
      referrals: referrals.map(ref => ({
        _id: ref._id,
        referredUser: ref.referredUser,
        status: ref.status,
        rewardAmount: ref.rewardAmount,
        createdAt: ref.createdAt
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get referral history error:', error);
    res.status(500).json({ error: 'Failed to get referral history' });
  }
});
app.get("/api/referrals/stats", async (req, res) => {
  try {
    const userId = req.user.id;

    const totalReferrals = await Referral.countDocuments({ referrer: userId });
    const completedReferrals = await Referral.countDocuments({ 
      referrer: userId, 
      status: 'credited' 
    });
    const pendingReferrals = await Referral.countDocuments({ 
      referrer: userId, 
      status: 'pending' 
    });
    
    const totalEarningsResult = await Referral.aggregate([
      { $match: { referrer: new mongoose.Types.ObjectId(userId), status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);

    const user = await User.findById(userId);

    res.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings: totalEarningsResult[0]?.total || 0,
      walletBalance: user.walletBalance || 0
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});
app.get("/api/referrals/history", async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find({ referrer: userId })
      .populate('referredUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments({ referrer: userId });

    res.json({
      referrals: referrals.map(ref => ({
        _id: ref._id,
        referredUser: ref.referredUser,
        status: ref.status,
        rewardAmount: ref.rewardAmount,
        createdAt: ref.createdAt
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get referral history error:', error);
    res.status(500).json({ error: 'Failed to get referral history' });
  }
});
app.post("/api/referrals/complete", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const result = await completeReferral(userId, 0);
    
    if (!result) {
      return res.status(404).json({ error: 'No pending referral found' });
    }

    res.json({
      message: "Referral completed successfully",
      referral: result
    });
  } catch (error) {
    console.error('Complete referral error:', error);
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});
app.get("/api/user/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});
app.get("/api/admin/users", async (req, res) => {
  try {
    const user = await User.find();
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});
app.put("/api/user/profile", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select('-password');

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
app.post("/api/login/email", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const validPass = await bcrypt.compare(password, user.password);

    if (!validPass)
      return res.status(400).json({ error: "Invalid email or password" });

    res.json({
      message: "Login success",
      user,
      token: createToken(user),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/login/phone", async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ error: "Phone not registered" });

    res.json({
      message: "Phone login success",
      user,
      token: createToken(user),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/user/wallet/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/api/user/wallet/deduct/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    user.walletBalance -= amount;
    await user.save();

    res.json({ success: true, walletBalance: user.walletBalance, message: "Wallet deducted successfully" });
  } catch (error) {
    console.error("Error deducting wallet:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

export const upload = multer({ storage });

app.post(
  "/api/business/add-business",
  upload.single("logo"),
  async (req, res) => {
    try {
      const {
        vendorId,
        businessName,
        phone,
        email,
        businessTypes,
        industryType,
        registrationType,

        // STEP 2 fields
        address,
        state,
        city,
        pinCode,
        gstApplicable,
        gstNumber,
      } = req.body;

      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID required" });
      }

      // CLOUDINARY LOGO URL
      const logoUrl = req.file ? req.file.path : "";

      const newBusiness = new Bussiness({
        vendorId,
        businessName,
        phone,
        email,
        industryType,
        registrationType,
        businessTypes: JSON.parse(businessTypes),

        // CLOUDINARY URL
        logo: logoUrl,

        // Step 2 fields
        address,
        state,
        city,
        pinCode,
        gstApplicable: gstApplicable === "true",
        gstNumber,
      });

      await newBusiness.save();

      return res.status(201).json({
        message: "Business details saved successfully",
        business: newBusiness,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
    }
  }
);

app.get("/api/business/get-business/:vendorId", async (req, res) => {
  try {
    const business = await Bussiness.findOne({ vendorId: req.params.vendorId });
    res.json({ business });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
app.patch(
  "/api/business/update-business/:vendorId",
  upload.single("logo"),
  async (req, res) => {
    try {
      let updateData = { ...req.body };

      // Convert businessTypes from JSON string → Array
      if (req.body.businessTypes) {
        try {
          updateData.businessTypes = JSON.parse(req.body.businessTypes);
        } catch (e) {
          updateData.businessTypes = [];
        }
      }

      // Attach logo if file uploaded
      if (req.file) {
        updateData.logo = req.file ? req.file.path : "";
      }

      const updatedBusiness = await Bussiness.findOneAndUpdate(
        { vendorId: req.params.vendorId },
        updateData,
        { new: true }
      );

      if (!updatedBusiness) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      return res.json({
        success: true,
        message: "Business updated successfully",
        business: updatedBusiness,
      });
    } catch (err) {
      console.error("Update Error:", err);
      return res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
);


// Generates SKU using vendor initials + product initials + random number
const generateSKU = (vendorId, itemName) => {
  const vendorPart = vendorId
    ? vendorId.toString().slice(-3).toUpperCase()
    : "VEN";

  const namePart = itemName
    ? itemName.replace(/\s+/g, "").slice(0, 3).toUpperCase()
    : "PRD";

  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number

  return `APX-${vendorPart}-${namePart}-${randomPart}`;
};

const generateSlug = (text) =>
  text.toLowerCase().replace(/ /g, "-") + "-" + Date.now();

app.post("/api/products/add-product", upload.array("images", 10), async (req, res) => {
    try {
        const {
            vendorId,
            itemType,
            category,
            subcategory, // This is the ID of the subdocument
            itemName,

            gstRate,
            description,

            measuringUnit,
            hsnCode,
            godown,
            openStock,
            asOnDate,

            mrp,
            discount,
            afterDiscount,
            // REMOVED: commission is no longer submitted by the vendor
            finalAmount,
            priceType,
        } = req.body;

        // =============================
        // 🔹 CRITICAL SUBCATEGORY VALIDATION
        // =============================
        if (subcategory) {
            const parentCategory = await Category.findById(category).select('subcategories');

            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Validation Error: Parent category not found.",
                });
            }
            
            // Checks if the subcategory ID exists within the embedded array
            const subcategoryExists = parentCategory.subcategories.some(
                // Use .toString() for accurate comparison with a string ID from req.body
                sub => sub._id.toString() === subcategory
            );

            if (!subcategoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "Validation Error: Subcategory ID is invalid or does not belong to the selected category.",
                });
            }
        }
        
        // =============================
        // 🔹 Auto-generated fields
        // =============================
        const skuCode = generateSKU(vendorId, itemName);
        const slug = generateSlug(itemName);

        // =============================
        // 🔹 Cloudinary image URLs
        // =============================
        const images = req.files?.map((f) => f.path) || []; 

        // =========================================================================
        // 🌟 UPDATED: Commission is set to 0 and Status is set to 'Pending'
        // The final calculated commission will be applied by the admin later.
        // =========================================================================
        const COMMISSION_INITIAL = 0;
        const PRODUCT_STATUS = 'Pending'; 
        
        // =============================
        // 🔹 Create product document
        // =============================
        const product = new Products({
            vendorId,

            // PRODUCT DETAILS
            itemType: itemType || "product",
            category,       // ID of the main category
            subcategory,    // ID of the subcategory (optional)
            itemName,
            
            gstRate: Number(gstRate) || 0,
            description,
            images,
            slug,

            // STOCK DETAILS
            skuCode,
            measuringUnit: itemType === "service" ? "" : measuringUnit, 
            hsnCode: itemType === "service" ? "" : hsnCode, 
            godown: itemType === "service" ? "" : godown, 
            openStock: itemType === "service" ? 0 : (Number(openStock) || 0),
            asOnDate: itemType === "service" ? "" : asOnDate,

            // PRICE DETAILS
            userPrice: Number(mrp) || 0, // userPrice corresponds to mrp
            discount: Number(discount) || 0,
            afterDiscount: Number(afterDiscount) || 0,
            
            // Commission field is now hardcoded/set to 0 initially
            commission: COMMISSION_INITIAL, 
            
            finalAmount: Number(finalAmount) || 0, // This is the amount before commission (from frontend)
            priceType,

            // 🔹 NEW FIELD ADDED
            status: PRODUCT_STATUS,
        });

        await product.save();

        return res.json({
            success: true,
            message: "Product submitted successfully for admin approval.",
            product,
        });

    } catch (error) {
        console.error("Error Adding Product:", error);

        // Log specific validation errors if Mongoose throws them
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: "Mongoose Validation Failed", 
                errors: error.errors 
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});
app.post("/api/products/:id/:action", async (req, res) => {
    try {
        const { id, action } = req.params;
        const { commission } = req.body;

        // Validate action
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action specified. Must be 'approve' or 'reject'."
            });
        }

        // Find product
        const product = await Products.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        let updateFields = {};

        // ---------- REJECT ----------
        if (action === "reject") {
            updateFields.status = "Admin Rejected";
            updateFields.commission = 0;
            updateFields.finalAmount = product.afterDiscount;
        }

        // ---------- APPROVE ----------
        if (action === "approve") {
            const commissionRate = Number(commission);

            if (isNaN(commissionRate) || commissionRate < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Valid non-negative commission rate is required for approval."
                });
            }

            // Final vendor payout calculation
            const finalSalePrice = product.afterDiscount || 0;
            const finalAmountAfterCommission =
                finalSalePrice * (1 - commissionRate / 100);

            updateFields.status = "Admin Approved";    // 🔥 UPDATED STATUS
            updateFields.commission = commissionRate;
            updateFields.finalAmount = parseFloat(finalAmountAfterCommission.toFixed(2));
        }

        // Update DB
        const updatedProduct = await Products.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: `Product ${action === "approve" ? "approved" : "rejected"} successfully.`,
            product: updatedProduct
        });

    } catch (error) {
        console.error(`Error processing ${req.params.action} product:`, error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID format."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server Error while updating product status.",
            error: error.message
        });
    }
});
// OLD ROUTE (Vendor Confirm) -> NOW UPDATED TO DIRECT APPROVAL
app.post("/api/products/vendor/confirm/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // DIRECT APPROVAL (no vendor confirmation)
    product.status = "Approved";
    await product.save();

    return res.json({
      success: true,
      message: "Product approved successfully",
      product,
    });

  } catch (error) {
    console.error("Approval Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/products/vendor/reject/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    product.status = "Vendor Rejected";
    await product.save();

    return res.json({
      success: true,
      message: "Product rejected by vendor",
      product
    });

  } catch (error) {
    console.error("Vendor Reject Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


app.get("/api/products", async (req, res) => {
  try {
    // Fetch products and populate vendor and category details
    const products = await Products.find()
      .populate("vendorId", "name email") // only fetch vendor name & email
      .populate("category", "name")       // only fetch category name
      .populate("subcategory", "name");   // optional, if you have a subcategory collection

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Assuming Category and Products models are correctly imported

app.get("/api/products/:category", async (req, res) => {
    try {
        const categoryName = req.params.category;

        // 1. Find the category document by name
        const foundCategory = await Category.findOne({ name: categoryName });
        if (!foundCategory) {
            return res.json({
                success: true,
                products: []
            });
        }

        // 2. Fetch only Approved products
        const products = await Products.find({ 
            category: foundCategory._id,
            status: "Approved"
        })
        .populate("category", "name")
        .populate("vendorId", "name");  

        // 3. Add categoryName for convenience
        const productsWithCategoryName = products.map((p) => ({
            ...p._doc,
            categoryName: p.category?.name || "Unknown"
        }));

        return res.json({
            success: true,
            products: productsWithCategoryName
        });

    } catch (err) {
        console.error("Error fetching products by category:", err);
        return res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

app.get('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format." });
        }

        // Find the product by ID and populate vendor information
        const product = await Products.findById(productId).populate("vendorId", "name email");

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        // If your vendor data needs to be extracted nicely for the frontend:
        const productData = {
            ...product.toObject(),
            vendorName: product.vendorId ? product.vendorId.name : 'Unknown Store',
            // Remove the complex vendorId object from the root level if desired
            vendorId: product.vendorId ? product.vendorId._id : null
        };

        res.json(productData);
    } catch (err) {
        console.error(`Error fetching product ${req.params.id}:`, err);
        res.status(500).json({ error: "Server error while fetching product details." });
    }
});
app.put("/api/products/:id", upload.array("images", 10), async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const existingProduct = await Products.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Extract fields from form-data
    const {
      itemType,
      category,
      subcategory,
      itemName,
      salesPrice,
      gstRate,
      description,
      skuCode,
      measuringUnit,
      hsnCode,
      godown,
      openStock,
      asOnDate,
      mrp,
      discount,
      afterDiscount,
      commission,
      finalAmount,
      priceType,
    } = req.body;

    // Update fields
    existingProduct.itemType = itemType || existingProduct.itemType;
    existingProduct.category = category || existingProduct.category;
    existingProduct.subcategory = subcategory || existingProduct.subcategory;
    existingProduct.itemName = itemName || existingProduct.itemName;
    existingProduct.salesPrice = salesPrice || existingProduct.salesPrice;
    existingProduct.gstRate = gstRate || existingProduct.gstRate;
    existingProduct.description = description || existingProduct.description;
    existingProduct.skuCode = skuCode || existingProduct.skuCode;
    existingProduct.measuringUnit = measuringUnit || existingProduct.measuringUnit;
    existingProduct.hsnCode = hsnCode || existingProduct.hsnCode;
    existingProduct.godown = godown || existingProduct.godown;
    existingProduct.openStock = openStock || existingProduct.openStock;
    existingProduct.asOnDate = asOnDate || existingProduct.asOnDate;
    existingProduct.userPrice = mrp || existingProduct.userPrice;
    existingProduct.discount = discount || existingProduct.discount;
    existingProduct.afterDiscount = afterDiscount || existingProduct.afterDiscount;
    existingProduct.commission = commission || existingProduct.commission;
    existingProduct.finalAmount = finalAmount || existingProduct.finalAmount;
    existingProduct.priceType = priceType || existingProduct.priceType;

    // Handle image uploads (Cloudinary example)
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      for (const file of req.files) {
        // Upload to Cloudinary
        // const uploadResult = await cloudinary.uploader.upload_stream(...);
        // For demo, let's just store a placeholder URL
        uploadedUrls.push(`uploaded/${file.originalname}`);
      }
      existingProduct.images = uploadedUrls;
    }

    await existingProduct.save();

    res.json({ success: true, message: "Product updated successfully", product: existingProduct });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Server error while updating product" });
  }
});
app.delete("/api/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const vendorId = req.body.vendorId; // send vendorId from frontend

    if (!vendorId) return res.status(401).json({ error: "Unauthorized" });

    const product = await Products.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.vendorId.toString() !== vendorId) {
      return res.status(403).json({ error: "You cannot delete this product" });
    }

    await Products.findByIdAndDelete(productId);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/products/vendor/:vendorId", async (req, res) => {
  try {
    const products = await Products.find({ vendorId: req.params.vendorId })
      .populate("category", "name"); 

    const productsWithCategory = products.map((p) => ({
      ...p._doc,
      categoryName: p.category?.name || "Unknown"
    }));

    res.json(productsWithCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/api/cart/add", async (req, res) => {
  try {
    const { userId, productId, name, price, image, quantity = 1, selectedColor, vendorId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "User ID and Product ID are required" });
    }

    // Check if the same product with same color exists
    const existingItem = await Cart.findOne({ userId, productId, selectedColor });

    let cartItem;
    if (existingItem) {
      // Increment quantity
      existingItem.quantity += Number(quantity);
      cartItem = await existingItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId,
        productId,
        name,
        price,
        image,
        quantity: Number(quantity),
        selectedColor,
        vendorId,
      });
    }

    res.json({ success: true, message: "Added to cart", cart: cartItem });
  } catch (error) {
    console.error("Cart error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get cart items by userId
app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const cartItems = await Cart.find({ userId });

    res.json({
      count: cartItems.length,
      cart: cartItems
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (!userId || !productId || quantity < 1) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const cartItem = await Cart.findOne({ userId, productId });
    if (!cartItem) return res.status(404).json({ error: "Cart item not found" });

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ message: "Quantity updated", cart: cartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------- Remove Item ----------------------
app.delete("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    const deleted = await Cart.findOneAndDelete({ userId, productId });
    if (!deleted) return res.status(404).json({ error: "Cart item not found" });

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/wishlist/toggle", async (req, res) => {
  const { userId, productId } = req.body;

  try {
    // Check if the product is already in wishlist
    const existing = await Wishlist.findOne({ userId, productId });

    if (existing) {
      // Remove from wishlist
      await Wishlist.deleteOne({ _id: existing._id });
      return res.json({ success: true, message: "Product removed from wishlist" });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();
    res.json({ success: true, message: "Product added to wishlist" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/wishlist/status", async (req, res) => {
  const { userId, productId } = req.query;

  try {
    const exists = await Wishlist.findOne({ userId, productId });
    res.json({ success: true, isWishlisted: !!exists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/wishlist/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const wishlist = await Wishlist.find({ userId }).populate("productId");
    // Map to return product details only
    const formatted = wishlist.map(item => ({
      _id: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      stock: item.productId.stock
    }));

    res.json({ success: true, wishlist: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/user/address/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify the requested userId matches the authenticated user
    if (userId.toString() !== userId) {
      return res.status(403).json({ 
        error: "Not authorized to access these addresses" 
      });
    }

    const addresses = await Address.find({ userId: userId }).sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ 
      addresses: addresses,
      defaultAddress: addresses.find(addr => addr.isDefault) || addresses[0] || null
    });

  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ 
      error: "Server error while fetching addresses" 
    });
  }
});
app.post("/api/user/address", auth, async (req, res) => {
  try {
    const { name, phone, pincode, city, state, address, isDefault, id } = req.body;
    
    // Validate required fields
    if (!name || !phone || !pincode || !city || !state || !address) {
      return res.status(400).json({ 
        error: "All address fields are required" 
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        error: "Please enter a valid 10-digit phone number" 
      });
    }

    // Validate pincode (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({ 
        error: "Please enter a valid 6-digit pincode" 
      });
    }

    // Get user ID from authenticated request
    const userId = req.user._id;

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await Address.updateMany(
        { userId: userId },
        { $set: { isDefault: false } }
      );
    }

    let addressDoc;
    
    if (id) {
      // Update existing address - ensure it belongs to the user
      addressDoc = await Address.findOneAndUpdate(
        { _id: id, userId: userId },
        { 
          name, 
          phone, 
          pincode, 
          city, 
          state, 
          address, 
          isDefault 
        },
        { new: true, runValidators: true }
      );

      if (!addressDoc) {
        return res.status(404).json({ 
          error: "Address not found or you don't have permission to edit it" 
        });
      }
    } else {
      // Create new address
      addressDoc = await Address.create({
        userId: userId,
        name,
        phone,
        pincode,
        city,
        state,
        address,
        isDefault: isDefault || false
      });
    }

    res.json({ 
      message: id ? "Address updated successfully" : "Address added successfully", 
      address: addressDoc 
    });

  } catch (err) {
    console.error("Address save error:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "Address already exists" 
      });
    }
    
    res.status(500).json({ 
      error: "Server error while saving address" 
    });
  }
});
app.post("/api/orders", auth, async (req, res) => {
  try {
    const {
      userId,
      userDetails,
      shippingAddress,
      paymentDetails,
      orderItems: rawItems,
      orderSummary: frontendSummary,
      metadata,
      paymentProof // New field for UPI payment proof
    } = req.body;

    console.log("Received order data:", {
      userId,
      paymentMethod: paymentDetails?.method,
      paymentStatus: paymentDetails?.status,
      hasPaymentProof: !!paymentProof,
      rawItems: rawItems?.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        productId: item.productId
      })),
      frontendSummary
    });

    // Validate required fields
    if (!userId || !shippingAddress || !rawItems || rawItems.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required order fields" });
    }

    // Verify user authorization
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to create order for this user" });
    }

    // Check if this is user's first order
    const orderCount = await Order.countDocuments({ userId });
    const isFirstOrder = orderCount === 0;

    // Map frontend products to backend orderItems & calculate totals
    const orderItems = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of rawItems) {
      const productId = item.productId || item._id;
      
      if (!productId) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ID missing for item: ${item.name}` 
        });
      }

      const product = await Products.findById(productId);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Product "${item.name}" not found` 
        });
      }

      const quantity = Number(item.quantity) || 1;
      
      // **CRITICAL FIX: Use the price sent from frontend, not recalculate**
      const price = Number(item.price) || 0;
      
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product "${item.name}"`
        });
      }

      // Calculate item totals based on frontend price
      const itemTotal = price * quantity;
      
      // Check stock
      if (product.openStock < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for "${item.name}". Available: ${product.openStock}, Requested: ${quantity}` 
        });
      }

      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: item.name || product.name,
        price: price, // Use the price from frontend
        quantity: quantity,
        originalPrice: product.salesPrice || price,
        image: item.image || product.images?.[0] || "https://via.placeholder.com/150",
        vendorId: product.vendorId,
        itemTotal: itemTotal,
        // Include color/size if available
        color: item.color || 'default',
        size: item.size || 'One Size'
      });
    }

    // **CRITICAL FIX: Use frontend summary OR calculate consistently**
    const orderSummary = {
      itemsCount: orderItems.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: frontendSummary?.subtotal || subtotal,
      discount: frontendSummary?.discount || 0,
      shipping: frontendSummary?.shipping || 0,
      tax: frontendSummary?.tax || 0,
      total: frontendSummary?.total || (subtotal + (frontendSummary?.shipping || 0)),
      grandTotal: frontendSummary?.total || (subtotal + (frontendSummary?.shipping || 0))
    };

    console.log("Final order summary:", orderSummary);

    // **ENHANCED PAYMENT HANDLING**
    let paymentStatus = "pending";
    let orderStatus = "pending";
    let upiDetails = null;
    let paymentProofData = null;

    // Handle different payment methods
    switch (paymentDetails?.method) {
      case "cod":
        paymentStatus = "completed";
        orderStatus = "confirmed";
        break;
        
      case "wallet":
        paymentStatus = "completed";
        orderStatus = "confirmed";
        break;
        
      case "upi":
        // For UPI, require payment proof and set to pending verification
        if (!paymentProof || !paymentDetails?.transactionId) {
          return res.status(400).json({
            success: false,
            message: "UPI payment requires screenshot and transaction ID"
          });
        }
        
        paymentStatus = "pending_verification";
        orderStatus = "payment_pending";
        
        // Create UPI details object
        upiDetails = {
          upiId: paymentDetails.upiId || "9177176969-2@ybl",
          screenshot: paymentProof.url || paymentProof.screenshot || paymentProof,
          transactionId: paymentDetails.transactionId,
          verified: false,
          uploadedAt: new Date()
        };
        
        // Create payment proof object
        paymentProofData = {
          type: paymentProof.type || 'upi_screenshot',
          url: paymentProof.url || paymentProof.screenshot || paymentProof,
          transactionReference: paymentDetails.transactionId,
          upiId: paymentDetails.upiId || "9177176969-2@ybl",
          fileName: paymentProof.fileName || `payment_proof_${Date.now()}`,
          fileSize: paymentProof.fileSize,
          mimeType: paymentProof.mimeType || 'image/jpeg'
        };
        break;
        
      case "card":
        paymentStatus = "completed";
        orderStatus = "confirmed";
        break;
        
      default:
        paymentStatus = "pending";
        orderStatus = "pending";
    }

    // Create enhanced payment details object
    const enhancedPaymentDetails = {
      method: paymentDetails?.method || "cod",
      status: paymentStatus,
      amount: orderSummary.total,
      transactionId: paymentDetails?.transactionId,
      paymentDate: paymentStatus === "completed" ? new Date() : null,
      upiDetails: upiDetails,
      paymentProof: paymentProofData
    };

    // Create order
    const orderData = {
      userId,
      userDetails: userDetails || {
        userId: req.user._id,
        name: req.user.name || req.user.username,
        email: req.user.email,
        phone: shippingAddress.phone
      },
      shippingAddress,
      paymentDetails: enhancedPaymentDetails,
      orderItems,
      orderSummary,
      orderStatus: {
        currentStatus: orderStatus,
        timeline: [{
          status: orderStatus,
          timestamp: new Date(),
          description: getStatusDescription(orderStatus),
          updatedBy: 'system'
        }]
      },
      deliveryDetails: {
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        shippingMethod: "Standard Delivery"
      },
      metadata: {
        ...metadata,
        isFirstOrder,
        source: 'cart',
        requiresPaymentVerification: paymentDetails?.method === 'upi'
      }
    };

    const order = new Order(orderData);
    await order.save();

    console.log(`Order created with status: ${orderStatus}, Payment: ${paymentStatus}`);

    // **STOCK MANAGEMENT - Only decrement for confirmed orders**
    if (orderStatus === "confirmed" || paymentStatus === "completed") {
      for (const item of orderItems) {
        await Products.findByIdAndUpdate(
          item.productId, 
          { $inc: { openStock: -item.quantity } }
        );
      }
      console.log("Stock decremented for confirmed order");
    } else {
      console.log("Stock NOT decremented - order pending payment verification");
    }

    // **WALLET DEDUCTION - Only for completed payments**
    if (paymentDetails?.method === "wallet" && paymentStatus === "completed") {
      try {
        const walletRes = await fetch(`https://api.apexbee.in/api/user/wallet/deduct/${userId}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}` 
          },
          body: JSON.stringify({ 
            amount: orderSummary.total,
            orderId: order._id 
          })
        });
        
        if (!walletRes.ok) {
          console.warn("Wallet deduction failed but order was placed");
          // Optionally update order status to reflect wallet issue
        } else {
          console.log("Wallet deduction successful");
        }
      } catch (walletError) {
        console.error("Wallet deduction error:", walletError);
      }
    }

    // **REFERRAL REWARD - Only for completed payments**
    let referralResult = null;
    if (isFirstOrder && (paymentStatus === "completed" || paymentDetails?.method === "cod")) {
      try {
        referralResult = await completeReferral(userId, orderSummary.total);
        if (referralResult) {
          order.metadata.referralCompleted = true;
          order.metadata.referralId = referralResult._id;
          order.metadata.rewardAmount = referralResult.rewardAmount;
          await order.save();
          console.log("Referral reward processed");
        }
      } catch (err) {
        console.error("Error completing referral:", err);
      }
    }

    // **SEND NOTIFICATIONS**
    try {
      // Notify admin about pending UPI verification
      if (paymentDetails?.method === "upi") {
        await notifyAdminForUPIVerification(order);
      }
      
      // Send order confirmation to user
      await sendOrderConfirmation(order, req.user);
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
      // Don't fail the order if notifications fail
    }

    res.status(201).json({
      success: true,
      message: getOrderSuccessMessage(paymentDetails?.method, paymentStatus),
      order,
      requiresVerification: paymentDetails?.method === 'upi',
      referral: isFirstOrder && (paymentStatus === "completed" || paymentDetails?.method === "cod")
        ? { 
            completed: !!referralResult, 
            message: referralResult ? "Referral reward credited!" : "No referral found" 
          }
        : null
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while creating order",
      error: error.message 
    });
  }
});

// Helper function for status descriptions
function getStatusDescription(status) {
  const descriptions = {
    'pending': 'Order received and being processed',
    'confirmed': 'Order confirmed and payment verified',
    'processing': 'Order is being prepared for shipment',
    'shipped': 'Order has been shipped',
    'delivered': 'Order has been delivered',
    'cancelled': 'Order has been cancelled',
    'refunded': 'Order has been refunded',
    'payment_pending': 'UPI payment pending verification',
    'payment_verified': 'Payment has been verified successfully'
  };
  return descriptions[status] || 'Order status updated';
}

// Helper function for success messages
function getOrderSuccessMessage(paymentMethod, paymentStatus) {
  if (paymentMethod === 'upi' && paymentStatus === 'pending_verification') {
    return "Order placed successfully! Payment verification pending. We'll notify you once verified.";
  }
  return "Order created successfully";
}




app.get("/api/orders/vendor/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  try {
    // Find orders that contain at least one item for this vendor
    const orders = await Order.find({ "orderItems.vendorId": vendorId })
      .sort({ createdAt: -1 }); // latest first

    // Filter orderItems to include only this vendor's products
    const vendorOrders = orders.map(order => {
      const vendorItems = order.orderItems.filter(
        item => item.vendorId.toString() === vendorId
      );

      // Calculate totals for this vendor's items
      const subtotal = vendorItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const shipping = order.orderSummary?.shipping || 0;
      const discount = order.orderSummary?.discount || 0;
      const tax = order.orderSummary?.tax || 0;
      const total = subtotal + shipping - discount + tax;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        userDetails: order.userDetails,
        shippingAddress: order.shippingAddress,
        paymentDetails: order.paymentDetails,
        orderStatus: order.orderStatus,
        deliveryDetails: order.deliveryDetails,
        metadata: order.metadata,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        orderItems: vendorItems,
        orderSummary: {
          itemsCount: vendorItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          shipping,
          discount,
          tax,
          total,
        },
      };
    });

    res.json({ success: true, orders: vendorOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/orders/user/:userId - Get user's orders
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user authorization


    const orders = await Order.find({ userId })
      .populate('orderItems.productId', 'name images category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// GET /api/orders/:orderId - Get specific order
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('orderItems.productId', 'name images category description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

  

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// PUT /api/orders/:orderId/status - Update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.orderStatus.currentStatus = status;
    order.orderStatus.timeline.push({
      status,
      timestamp: new Date(),
      description: description || `Order status updated to ${status}`
    });

    // If order is delivered, update actual delivery date
    if (status === 'delivered') {
      order.deliveryDetails.actualDeliveryDate = new Date();
    }

    // If order is cancelled, restore product stock
    if (status === 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        orderStatus: order.orderStatus
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});
// PUT /api/orders/:id/verify-payment - Verify UPI payment
app.put("/api/orders/:id/verify-payment", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user._id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can verify payments"
      });
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'reject'"
      });
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if payment method is UPI
    if (order.paymentDetails.method !== 'upi') {
      return res.status(400).json({
        success: false,
        message: "This order does not have UPI payment"
      });
    }

    // Check if payment is pending verification
    if (order.paymentDetails.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: "Payment is not pending verification"
      });
    }

    // Update payment status based on action
    if (action === 'approve') {
      // Approve payment
      order.paymentDetails.status = 'verified';
      order.paymentDetails.upiDetails.verified = true;
      order.paymentDetails.upiDetails.verifiedBy = adminId;
      order.paymentDetails.upiDetails.verifiedAt = new Date();
      order.paymentDetails.upiDetails.verificationNotes = notes || 'Payment verified successfully';
      order.paymentDetails.paymentDate = new Date();
      
      // Update order status
      order.orderStatus.currentStatus = 'confirmed';
      
      // Add to timeline
      order.orderStatus.timeline.push({
        status: 'payment_verified',
        timestamp: new Date(),
        description: 'UPI payment verified and approved',
        updatedBy: 'admin'
      });

      // Decrement stock since payment is now verified
      for (const item of order.orderItems) {
        await Products.findByIdAndUpdate(
          item.productId,
          { $inc: { openStock: -item.quantity } }
        );
      }

      // Send approval notification to customer
      await sendPaymentApprovalNotification(order, req.user);

    } else if (action === 'reject') {
      // Reject payment
      if (!notes || notes.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Rejection notes are required"
        });
      }

      order.paymentDetails.status = 'rejected';
      order.paymentDetails.upiDetails.verified = false;
      order.paymentDetails.upiDetails.verificationNotes = notes;
      
      // Update order status
      order.orderStatus.currentStatus = 'cancelled';
      
      // Add to timeline
      order.orderStatus.timeline.push({
        status: 'payment_failed',
        timestamp: new Date(),
        description: 'UPI payment rejected: ' + notes,
        updatedBy: 'admin'
      });

      // Send rejection notification to customer
      await sendPaymentRejectionNotification(order, notes, req.user);
    }

    await order.save();

    res.json({
      success: true,
      message: `Payment ${action}d successfully`,
      order: order
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
      error: error.message
    });
  }
});
// PUT /api/orders/:id/status - Update order status
app.put("/api/orders/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user is authorized (vendor can only update their own orders)
    const isVendorOrder = order.orderItems.some(item => 
      item.vendorId && item.vendorId.toString() === userId.toString()
    );
    
    if (!isVendorOrder && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order"
      });
    }

    // Update order status
    order.orderStatus.currentStatus = status;
    
    // Add to timeline
    if (!order.orderStatus.timeline) {
      order.orderStatus.timeline = [];
    }
    
    order.orderStatus.timeline.push({
      status: status,
      timestamp: new Date(),
      description: getStatusDescription(status),
      updatedBy: req.user.role === 'admin' ? 'admin' : 'vendor'
    });

    // Set delivery date if status is delivered
    if (status === 'delivered') {
      order.deliveryDetails.actualDeliveryDate = new Date();
      order.deliveredAt = new Date();
    }

    // Set cancelled date if status is cancelled
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      
      // Restore stock if order is cancelled
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          await Products.findByIdAndUpdate(
            item.productId,
            { $inc: { openStock: item.quantity } }
          );
        }
      }
    }

    await order.save();

    // Send notification to customer
    try {
      await sendOrderStatusUpdateNotification(order, status, req.user);
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: order
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
      error: error.message
    });
  }
});


// Notification functions
async function sendOrderStatusUpdateNotification(order, newStatus, user) {
  try {
    // Implement your notification logic here
    // This could be email, push notification, SMS, etc.
    console.log(`Order status update: Order #${order.orderNumber} status changed to ${newStatus} by ${user.name}`);
    
    // Example email implementation
    // await sendEmail({
    //   to: order.userDetails.email,
    //   subject: `Order Status Update - #${order.orderNumber}`,
    //   template: 'order-status-update',
    //   data: { order, newStatus, user }
    // });
  } catch (error) {
    console.error("Error sending status notification:", error);
  }
}

async function sendPaymentApprovalNotification(order, admin) {
  try {
    console.log(`Payment approved: Order #${order.orderNumber} payment approved by ${admin.name}`);
    
    // Example implementation
    // await sendEmail({
    //   to: order.userDetails.email,
    //   subject: `Payment Approved - Order #${order.orderNumber}`,
    //   template: 'payment-approved',
    //   data: { order, admin }
    // });
  } catch (error) {
    console.error("Error sending approval notification:", error);
  }
}

async function sendPaymentRejectionNotification(order, rejectionNotes, admin) {
  try {
    console.log(`Payment rejected: Order #${order.orderNumber} payment rejected by ${admin.name}`);
    
    // Example implementation
    // await sendEmail({
    //   to: order.userDetails.email,
    //   subject: `Payment Rejected - Order #${order.orderNumber}`,
    //   template: 'payment-rejected',
    //   data: { order, rejectionNotes, admin }
    // });
  } catch (error) {
    console.error("Error sending rejection notification:", error);
  }
}
// PUT /api/orders/:orderId/payment - Update payment status
app.put('/api/orders/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentDetails.status = paymentStatus;
    if (transactionId) {
      order.paymentDetails.transactionId = transactionId;
    }
    if (paymentStatus === 'completed') {
      order.paymentDetails.paymentDate = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      order: {
        _id: order._id,
        paymentDetails: order.paymentDetails
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    });
  }
});
app.post("/api/categories", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;

    // Validate fields
    if (!name || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Name and image are required",
      });
    }

    // Check category exists
    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Cloudinary image URL
    const imageUrl = req.file.path;

    // Create new category
    const newCategory = new Category({
      name: name.trim(),
      image: imageUrl, // Cloudinary image URL
    });

    await newCategory.save();

    return res.json({
      success: true,
      message: "Category created successfully",
      category: newCategory,
    });

  } catch (err) {
    console.error("Category creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update Category
app.put("/api/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    category.name = name || category.name;
    if (req.file) category.image = req.file.path; // Cloudinary URL

    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
});

// --- SUBCATEGORY ENDPOINTS ---

// Add Subcategory
app.post("/api/subcategories", upload.single("image"), async (req, res) => {
try {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Name and category are required" });
    }

    // Image path from multer
    const image = req.file ? req.file.path : "";

    // Create and save subcategory
    const subcategory = new Subcategory({ name, category, image });
    await subcategory.save();

    res.json({ success: true, subcategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }

});

// Update Subcategory
app.put("/api/subcategories/:id", upload.single("image"), async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found" });

    subcategory.name = req.body.name || subcategory.name;
    subcategory.category = req.body.category || subcategory.category;
    if (req.file) subcategory.image = req.file.path; // Cloudinary URL

    await subcategory.save();
    res.json({ success: true, subcategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update subcategory" });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    res.json({ success: true, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch category" });
  }
});


app.delete("/api/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
});

// Get subcategories by category
app.get("/api/subcategories", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const subcategories = await Subcategory.find(filter).populate("category", "name");
    res.json({ success: true, subcategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Delete subcategory
app.delete("/api/subcategories/:id", async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete subcategory" });
  }
});
app.get("/api/subcategories/:id", async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate("category");
    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found" });
    res.json({ success: true, subcategory });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch subcategory" });
  }
});
app.post('/api/categories/:categoryId/subcategories', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body; // Expecting { "name": "New Subcategory Name" }

        if (!name) {
            return res.status(400).json({ message: 'Subcategory name is required.' });
        }

        // 1. Check for duplicate subcategory name globally (optional but recommended)
        const nameExists = await Category.findOne({
            'subcategories.name': name 
        });
        if (nameExists) {
            return res.status(409).json({ message: 'Subcategory name already exists.' });
        }
        
        // 2. Add the new subcategory using $push
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { 
                $push: { 
                    subcategories: { name: name } // Mongoose will automatically assign an _id
                } 
            },
            { 
                new: true, // Return the modified document
                runValidators: true // Run schema validators on the subdocument
            }
        ).select('subcategories'); // Only return the subcategories array or the updated category

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        
        // Find the ID of the new subcategory that Mongoose just created
        const newSubcategory = updatedCategory.subcategories.find(sub => sub.name === name);

        res.status(201).json({
            message: 'Subcategory added successfully',
            updatedCategory: updatedCategory, // Return the full updated category
            newSubcategoryId: newSubcategory._id // Return the new ID for the frontend to select
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
app.get("/api/dashboard/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Fetch all orders containing items of this vendor
    const orders = await Order.find({
      "orderItems.vendorId": vendorId
    });

    if (!orders || orders.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalOrders: 0,
          canceledOrders: 0,
          completedOrders: 0,
          returnedOrders: 0,
          profit: 0,
          loss: 0,
        },
      });
    }

    let totalOrders = 0;
    let canceledOrders = 0;
    let completedOrders = 0;
    let returnedOrders = 0;
    let profit = 0;
    let loss = 0;

    orders.forEach(order => {
      const status = order.orderStatus?.currentStatus;

      // Order counts
      totalOrders++;

      if (status === "canceled") canceledOrders++;
      if (status === "completed" || status === "confirmed") completedOrders++;
      if (status === "returned") returnedOrders++;

      // Calculate profit/loss per item
      order.orderItems.forEach(item => {
        if (item.vendorId === vendorId) {
          const amount = item.itemTotal || 0;

          if (amount >= 0) profit += amount;
          else loss += Math.abs(amount);
        }
      });
    });

    return res.json({
      success: true,
      stats: {
        totalOrders,
        canceledOrders,
        completedOrders,
        returnedOrders,
        profit,
        loss,
      }
    });

  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/admin/business", async (req, res) => {
  try {
    const businesses = await Bussiness.find()
      .populate("vendorId", "name email phone") // fetch vendor data
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// UPDATE BUSINESS STATUS
app.put("/api/admin/business/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    // VALIDATION
    const validStatuses = ["approved", "rejected", "blocked", "pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updatedBusiness = await Bussiness.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedBusiness) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    res.json({
      success: true,
      message: `Business ${status} successfully`,
      business: updatedBusiness,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST form data
app.post("/api/:endpoint", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const formType = req.params.endpoint; // use endpoint name as form type

    const newForm = new Form({
      name,
      email,
      phone,
      message,
      formType,
    });

    await newForm.save();
    res.status(201).json({ success: true, message: "Form submitted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// GET all form submissions (optional)
app.get("/api/:endpoint", async (req, res) => {
  try {
    const forms = await Form.find({ formType: req.params.endpoint }).sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});
app.get("/api/admin/forms", async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json({ success: true, count: forms.length, forms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
app.get("/api/admin/dashboard/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const totalProducts = await Products.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingShopApprovals = await Vendor.countDocuments({ status: "pending" });

    // Total revenue: sum of all completed order amounts
    const completedOrders = await Order.find({ status: "completed" });
    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.totalAmount, 0);

    res.json({
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      pendingShopApprovals,
      totalRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/dashboard/sales
app.get("/api/admin/dashboard/sales", async (req, res) => {
  try {
    // Example: monthly sales data
    const salesData = [];

    const currentYear = new Date().getFullYear();
    for (let month = 0; month < 12; month++) {
      const start = new Date(currentYear, month, 1);
      const end = new Date(currentYear, month + 1, 0);

      const monthlyOrders = await Order.find({
        status: "completed",
        createdAt: { $gte: start, $lte: end },
      });

      const revenue = monthlyOrders.reduce((acc, order) => acc + order.totalAmount, 0);
      const sales = monthlyOrders.length;

      salesData.push({
        month: start.toLocaleString("default", { month: "short" }),
        revenue,
        sales,
      });
    }

    res.json(salesData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/dashboard/recent-activity
app.get("/api/admin/dashboard/recent-activity", async (req, res) => {
  try {
    // Get latest 10 activities: orders, user actions, product actions
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .populate("products.Products", "itemName");

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProducts = await Products.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = [];

    recentOrders.forEach((order) => {
      recentActivity.push({
        _id: order._id,
        action: "Order Placed",
        order,
        user: order.user,
        createdAt: order.createdAt,
      });
    });

    recentUsers.forEach((user) => {
      recentActivity.push({
        _id: user._id,
        action: "New User Registered",
        user,
        createdAt: user.createdAt,
      });
    });

    recentProducts.forEach((product) => {
      recentActivity.push({
        _id: product._id,
        action: "Product Added",
        product,
        createdAt: product.createdAt,
      });
    });

    // Sort all activities by createdAt descending
    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to 10
    res.json(recentActivity.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/products/:id/approve", async (req, res) => {
  try {
    const product = await Products.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product approved successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject product
app.post("/api/products/:id/reject", async (req, res) => {
  try {
    const product = await Products.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product rejected successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/admin/orders", async (req, res) => {
   try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('orderItems.productId', 'itemName salesPrice')
      .populate('orderItems.vendorId', 'name email')
      .sort({ createdAt: -1 }); // latest first

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/vendors
app.get("/api/admin/vendors", async (req, res) => {
  try {
    const vendors = await Vendor.find(); // fetch all vendors
    res.json({ vendors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
// PUT /api/admin/vendor/:vendorId/status
app.put("/api/admin/vendor/:vendorId/status", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    vendor.status = status;
    await vendor.save();

    res.json({ message: "Vendor status updated", vendor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
// GET /api/admin/business
app.get("/api/admin/businesses", async (req, res) => {
  try {
    const businesses = await Bussiness.find().populate("vendorId", "name email"); // optional populate vendor info
    res.json({ businesses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
// PUT /api/admin/business/:businessId/status
app.put("/api/admin/business/:businessId/status", async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ error: "Business not found" });

    business.status = status;
    await business.save();

    res.json({ message: "Business status updated", business });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
app.get('/api/user/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
app.put('/api/user/profile/:userId', auth, async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender, bio } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (bio) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
app.put('/api/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get previous status
    const previousStatus = order.orderStatus.currentStatus;
    
    // Update status
    order.orderStatus.currentStatus = status;
    
 
    
    // Update delivery details if delivered
    if (status === 'delivered') {
      order.deliveryDetails.actualDelivery = new Date();
      
      // Auto-complete payment if it was pending verification
      if (order.paymentDetails.status === 'requires_verification') {
        order.paymentDetails.status = 'completed';
        order.paymentDetails.paymentDate = new Date();
      }
    }
    
    // Save order
    await order.save();
    
    // Populate user details for response
    const populatedOrder = await Order.findById(orderId)
      .populate('userId', 'name email')
      .populate('orderItems.productId', 'name sku');
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: populatedOrder._id,
        orderNumber: populatedOrder.orderNumber,
        userDetails: populatedOrder.userDetails,
        orderStatus: populatedOrder.orderStatus,
        paymentDetails: populatedOrder.paymentDetails,
        orderSummary: populatedOrder.orderSummary,
        updatedAt: populatedOrder.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.put('/api/admin/orders/:orderId/payment-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }
    
    // Validate payment status
    const validPaymentStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'requires_verification'];
    if (!validPaymentStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Valid statuses: ' + validPaymentStatuses.join(', ')
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get previous payment status
    const previousPaymentStatus = order.paymentDetails.status;
    
    // Update payment status
    order.paymentDetails.status = status;
    
    // Set payment date if completed
    if (status === 'completed') {
      order.paymentDetails.paymentDate = new Date();
      order.requiresVerification = false;
    }
    
    // Add note to order
    if (!order.notes) {
      order.notes = '';
    }
    order.notes += `\n[${new Date().toLocaleString()}] Payment status changed from ${previousPaymentStatus} to ${status} by Admin`;
    
    // Save order
    await order.save();
    
    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentDetails: order.paymentDetails,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 3. GET /api/orders/:orderId/invoice - Download invoice (PDF)
app.get('/api/orders/:orderId/invoice', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('orderItems.productId', 'name sku');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check authorization - user must be admin or order owner
    if (req.user.role !== 'admin' && req.user.userId.toString() !== order.userId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this invoice'
      });
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(25).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Invoice details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${order.invoiceNumber}`);
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();
    
    // Company details
    doc.fontSize(14).text('ApexBee Store', { underline: true });
    doc.fontSize(10);
    doc.text('123 Business Street');
    doc.text('Mumbai, Maharashtra 400001');
    doc.text('GSTIN: 27ABCDE1234F1Z5');
    doc.text('Phone: +91 1234567890');
    doc.text('Email: support@apexbee.com');
    doc.moveDown();
    
    // Billing details
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(order.userDetails.name);
    if (order.userId.email) doc.text(order.userId.email);
    if (order.shippingAddress.phone) doc.text(`Phone: ${order.shippingAddress.phone}`);
    doc.moveDown();
    
    // Shipping address
    doc.fontSize(12).text('Ship To:', { underline: true });
    doc.fontSize(10);
    doc.text(order.shippingAddress.name);
    doc.text(order.shippingAddress.address);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
    doc.text(`Phone: ${order.shippingAddress.phone}`);
    doc.moveDown();
    
    // Table header
    const tableTop = doc.y;
    doc.fontSize(10);
    
    // Table columns
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 350, tableTop);
    doc.text('Amount', 400, tableTop);
    
    // Draw line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();
    
    let y = tableTop + 25;
    
    // Order items
    order.orderItems.forEach((item, i) => {
      doc.text(item.name, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`₹${item.price.toFixed(2)}`, 350, y);
      doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 400, y);
      y += 20;
    });
    
    // Draw line after items
    doc.moveTo(50, y + 5)
       .lineTo(550, y + 5)
       .stroke();
    
    y += 20;
    
    // Order summary
    doc.text('Subtotal:', 350, y);
    doc.text(`₹${order.orderSummary.subtotal.toFixed(2)}`, 400, y);
    y += 20;
    
    if (order.orderSummary.shipping > 0) {
      doc.text('Shipping:', 350, y);
      doc.text(`₹${order.orderSummary.shipping.toFixed(2)}`, 400, y);
      y += 20;
    }
    
    if (order.orderSummary.discount > 0) {
      doc.text('Discount:', 350, y);
      doc.text(`-₹${order.orderSummary.discount.toFixed(2)}`, 400, y);
      y += 20;
    }
    
    if (order.orderSummary.tax > 0) {
      doc.text('Tax:', 350, y);
      doc.text(`₹${order.orderSummary.tax.toFixed(2)}`, 400, y);
      y += 20;
    }
    
    // Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 350, y + 10);
    doc.text(`₹${order.orderSummary.total.toFixed(2)}`, 400, y + 10);
    
    y += 40;
    
    // Payment details
    doc.fontSize(10).font('Helvetica');
    doc.text('Payment Details:', 50, y);
    y += 15;
    doc.text(`Method: ${order.paymentDetails.method.toUpperCase()}`);
    y += 15;
    doc.text(`Status: ${order.paymentDetails.status}`);
    y += 15;
    if (order.paymentDetails.transactionId) {
      doc.text(`Transaction ID: ${order.paymentDetails.transactionId}`);
      y += 15;
    }
    
    // Footer
    doc.fontSize(8).text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });
    doc.text('Terms & Conditions: Goods sold are not returnable unless damaged during shipping.', 50, 720, { align: 'center', width: 500 });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

// Partial update user profile
app.patch('/api/user/profile/:userId', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'dateOfBirth', 'gender', 'bio', 'avatar'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.use("/uploads", express.static("uploads"));

// ----------------------
// START SERVER
// ----------------------
app.listen(5000, () => console.log("Server running on port 5000"));
