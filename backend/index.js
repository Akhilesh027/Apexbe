import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Vendor from "./models/vendor.js";
import Product from "./models/product.js";
import Cart from "./models/Cart.js";
import Address from "./models/Address.js";
import Order from "./models/Order.js";
import Wishlist from "./models/Wishlist.js";
import Category from "./models/Category.js";
import Subcategory from "./models/Subcategory.js";
const app = express();
app.use(express.json());
app.use(cors());

// ----------------------
// DB CONNECTION
// ----------------------
mongoose
  .connect("  mongodb://127.0.0.1:27017")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

// ----------------------
// REGISTER VENDOR
// ----------------------
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ error: "All fields required" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = new Vendor({
      name,
      email,
      password: hashedPassword,
    });

    await vendor.save();
    return res.json({ message: "Registration successful" });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
});

// ----------------------
// LOGIN VENDOR
// ----------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });
    if (!vendor)
      return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: vendor._id, email: vendor.email },
      "SECRET_KEY",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
});
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ---------------------------------------------
// 🔐 TOKEN CREATOR
// ---------------------------------------------
const createToken = (user) => {
  return jwt.sign(
    { id: user._id },
    "BANNU9", // You can change to process.env.JWT_SECRET
    { expiresIn: "7d" }
  );
};

// ---------------------------------------------
// 📌 REGISTER API
// ---------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPass,
    });

    res.json({
      message: "Registration successful",
      user: newUser,
      token: createToken(newUser),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------------------------
// 📌 LOGIN WITH EMAIL + PASSWORD
// ---------------------------------------------
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

// ---------------------------------------------
// 📌 LOGIN WITH PHONE (NO OTP FOR NOW)
// ---------------------------------------------
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

cloudinary.config({
  cloud_name: "dguxtvyut",
  api_key: "952138336163551",
  api_secret: "ppFNE2zTSuTPotEZcemJ_on7iHg",
});

// --- Multer + Cloudinary Storage ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "images",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const upload = multer({ storage });



// -------------------- ADD PRODUCT --------------------
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, subcategory, stock, description, vendorId } = req.body;

    const productData = {
      vendorId,
      name,
      price,
      category,
      subcategory,
      stock,
      description,
      image: req.file?.path || "", // Cloudinary URL
    };

    const product = await Product.create(productData);

    res.json({ success: true, message: "Product added", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/product", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- GET ALL PRODUCTS --------------------
// Updated GET /api/products route to support filtering by category
app.get("/api/products", async (req, res) => {
  try {
    // Extract the category filter from query parameters (e.g., /api/products?category=fashion)
    const { category } = req.query;

    // Build the MongoDB filter object
    let filter = {};

    if (category) {
      // If a category is provided, add it to the filter
      filter.category = category;
    }

    // Find products based on the filter and populate vendor details
    const products = await Product.find(filter).populate("vendorId", "name email");

    // Successfully return the products (either filtered or all)
    res.json(products);
  } catch (err) {
    // Log the error and send a 500 Internal Server Error status
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format." });
        }

        // Find the product by ID and populate vendor information
        const product = await Product.findById(productId).populate("vendorId", "name email");

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
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, subcategory, stock, description } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, price, and category are required" 
      });
    }

    // Prepare update object
    const updateData = {
      name,
      price: Number(price),
      category,
      subcategory: subcategory || undefined,
      stock: stock ? Number(stock) : undefined,
      description,
    };

    // Add Cloudinary image URL if uploaded
    if (req.file && req.file.path) {
      updateData.image = req.file.path; // Cloudinary URL
    }

    // Update product in DB
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully", product });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

// DELETE PRODUCT
app.delete("/api/product/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});
// -------------------- GET PRODUCTS OF LOGGED VENDOR --------------------
app.get("/api/products/:vendorId", async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.params.vendorId });
    res.json(products);
  } catch (err) {
    res.json({ error: err.message });
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
    const userId = req.params.userId;

    // If you have auth middleware that sets req.userId, then verify:
    if (req.userId && req.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const address = await Address.findOne({ userId });

    if (!address) {
      return res.json({ address: null }); // No address found yet
    }

    res.json({ address });
  } catch (err) {
    console.error("Error fetching address:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/user/address", async (req, res) => {
  try {
    const { name, phone, pincode, city, state, address, isDefault, id,userId } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await Address.updateMany(
        { userId: userId },
        { $set: { isDefault: false } }
      );
    }

    let doc;
    if (id) {
      // Update existing address
      doc = await Address.findOneAndUpdate(
        { _id: id, userId: userId },
        { name, phone, pincode, city, state, address, isDefault },
        { new: true }
      );
    } else {
      // Create new address
      doc = await Address.create({
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

    res.json({ message: "Address saved", address: doc });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      userId,
      userDetails,
      shippingAddress,
      paymentDetails,
      orderItems,
      orderSummary,
      metadata
    } = req.body;

    // Validate required fields
    if (!userId || !shippingAddress || !orderItems || !orderSummary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order fields'
      });
    }

    // Verify user authorization
    if (req.body.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create order for this user'
      });
    }

    // Check product availability and validate prices
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`
        });
      }

      // Validate price
      if (product.price !== item.price) {
        return res.status(400).json({
          success: false,
          message: `Price mismatch for ${item.name}`
        });
      }
    }

    // Create order with initial status
    const orderData = {
      userId,
      userDetails: userDetails || {
        userId: req.user._id,
        name: req.user.name || req.user.username,
        email: req.user.email
      },
      shippingAddress,
      paymentDetails: {
        ...paymentDetails,
        status: paymentDetails.method === 'cod' ? 'pending' : 'completed'
      },
      orderItems,
      orderSummary,
      orderStatus: {
        currentStatus: 'confirmed',
        timeline: [
          {
            status: 'confirmed',
            timestamp: new Date(),
            description: 'Order confirmed and payment processing'
          }
        ]
      },
      deliveryDetails: {
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        shippingMethod: 'Standard Delivery'
      },
      metadata: metadata || {}
    };

    const order = new Order(orderData);
    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate the order with product details
    await order.populate('orderItems.productId', 'name images category');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        userDetails: order.userDetails,
        shippingAddress: order.shippingAddress,
        paymentDetails: order.paymentDetails,
        orderItems: order.orderItems,
        orderSummary: order.orderSummary,
        orderStatus: order.orderStatus,
        deliveryDetails: order.deliveryDetails,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});
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
    if (!name || !req.file) {
      return res.status(400).json({ success: false, message: "Name and image required" });
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const newCategory = new Category({
      name,
      image: req.file.path, // Cloudinary URL
    });

    await newCategory.save();
    res.json({ success: true, category: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
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

    const image = req.file ? req.file.path : ""; // Cloudinary URL
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
app.get("/api/dashboard", async (req, res) => {
  try {
    // Total orders
    const totalOrders = await Order.countDocuments();

    // Canceled orders
    const canceledOrders = await Order.countDocuments({ status: "canceled" });

    // Completed orders
    const completedOrders = await Order.countDocuments({ status: "completed" });

    // Returned orders
    const returnedOrders = await Order.countDocuments({ status: "returned" });

    // Profit and Loss calculation (example)
    const completed = await Order.find({ status: "completed" });
    let profit = 0;
    completed.forEach((order) => {
      profit += order.totalAmount - (order.cost || 0); // Assuming each order has `totalAmount` and `cost`
    });

    const canceled = await Order.find({ status: "canceled" });
    let loss = 0;
    canceled.forEach((order) => {
      loss += order.totalAmount; // Lost revenue
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        canceledOrders,
        completedOrders,
        returnedOrders,
        profit,
        loss,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
});


app.use("/uploads", express.static("uploads"));

// ----------------------
// START SERVER
// ----------------------
app.listen(5000, () => console.log("Server running on port 5000"));
