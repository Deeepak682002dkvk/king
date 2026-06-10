import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic fallback Local JSON Database class
class LocalDatabase {
  private file: string;
  private data: { packages: any[], orders: any[] };

  constructor() {
    this.file = path.join(process.cwd(), "data", "db.json");
    if (!fs.existsSync(path.dirname(this.file))) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
    }
    if (fs.existsSync(this.file)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
      } catch (e) {
        this.data = { packages: [], orders: [] };
      }
    } else {
      this.data = { packages: [], orders: [] };
      this.save();
    }
    
    // Seed default packages if empty!
    if (!this.data.packages || this.data.packages.length === 0) {
      this.data.packages = [
        { id: "pkg_100", name: "Star Starter", diamonds: 100, bonus: 10, price: 80, image: "ruby" },
        { id: "pkg_310", name: "Neon Surge", diamonds: 310, bonus: 35, price: 240, image: "sapphire" },
        { id: "pkg_520", name: "Vortex Vault", diamonds: 520, bonus: 60, price: 400, image: "emerald" },
        { id: "pkg_1060", name: "Titan Chest", diamonds: 1060, bonus: 150, price: 800, image: "diamond" },
        { id: "pkg_2180", name: "Legendary Cache", diamonds: 2180, bonus: 300, price: 1600, image: "crown" },
        { id: "pkg_5600", name: "Cosmic Hoard", diamonds: 5600, bonus: 1000, price: 4000, image: "cosmos" }
      ];
      this.save();
    }
    
    if (!this.data.orders) {
      this.data.orders = [];
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2), "utf8");
  }

  getPackages() {
    return this.data.packages;
  }
  getPackage(id: string) {
    return this.data.packages.find(p => p.id === id);
  }
  createPackage(pkg: any) {
    const newPkg = { id: "pkg_" + Date.now(), ...pkg };
    this.data.packages.push(newPkg);
    this.save();
    return newPkg;
  }
  updatePackage(id: string, updates: any) {
    const idx = this.data.packages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.packages[idx] = { ...this.data.packages[idx], ...updates };
      this.save();
      return this.data.packages[idx];
    }
    return null;
  }
  deletePackage(id: string) {
    const beforeLength = this.data.packages.length;
    this.data.packages = this.data.packages.filter(p => p.id !== id);
    this.save();
    return this.data.packages.length < beforeLength;
  }

  getOrders() {
    return this.data.orders;
  }
  createOrder(order: any) {
    const newOrder = { id: "ord_" + Date.now(), createdAt: new Date().toISOString(), ...order };
    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }
  updateOrder(id: string, updates: any) {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
      this.save();
      return this.data.orders[idx];
    }
    return null;
  }
}

const localDb = new LocalDatabase();
let isMongo = false;
let MongoPackageModel: any = null;
let MongoOrderModel: any = null;

async function setupDatabaseAndModels() {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB via Mongoose successfully.");
      isMongo = true;

      const PackageSchema = new mongoose.Schema({
        name: String,
        diamonds: Number,
        bonus: Number,
        price: Number,
        image: String
      });
      PackageSchema.virtual('id').get(function() {
        return this._id.toHexString();
      });
      PackageSchema.set('toJSON', { virtuals: true });

      const OrderSchema = new mongoose.Schema({
        uid: String,
        nickname: String,
        packageId: String,
        packageName: String,
        diamonds: Number,
        bonus: Number,
        price: Number,
        quantity: Number,
        totalAmount: Number,
        paymentMethod: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
      });
      OrderSchema.virtual('id').get(function() {
        return this._id.toHexString();
      });
      OrderSchema.set('toJSON', { virtuals: true });

      MongoPackageModel = mongoose.models.Package || mongoose.model("Package", PackageSchema);
      MongoOrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);

      // Seed if MongoDB has no packages
      const count = await MongoPackageModel.countDocuments();
      if (count === 0) {
        const defaults = [
          { name: "Star Starter", diamonds: 100, bonus: 10, price: 80, image: "ruby" },
          { name: "Neon Surge", diamonds: 310, bonus: 35, price: 240, image: "sapphire" },
          { name: "Vortex Vault", diamonds: 520, bonus: 60, price: 400, image: "emerald" },
          { name: "Titan Chest", diamonds: 1060, bonus: 150, price: 800, image: "diamond" },
          { name: "Legendary Cache", diamonds: 2180, bonus: 300, price: 1600, image: "crown" },
          { name: "Cosmic Hoard", diamonds: 5600, bonus: 1000, price: 4000, image: "cosmos" }
        ];
        await MongoPackageModel.insertMany(defaults);
      }
    } catch (err) {
      console.warn("MongoDB connection failed. Carrying over local fallback storage mechanism.", err);
      isMongo = false;
    }
  } else {
    console.log("No MONGO_URI specified. Proceeding with robust local file database persistence.");
    isMongo = false;
  }
}

// Global DB abstraction object
const db = {
  getPackages: async () => {
    if (isMongo && MongoPackageModel) {
      const docs = await MongoPackageModel.find({});
      return docs.map((doc: any) => doc.toJSON());
    }
    return localDb.getPackages();
  },
  getPackage: async (id: string) => {
    if (isMongo && MongoPackageModel && id.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await MongoPackageModel.findById(id);
      return doc ? doc.toJSON() : null;
    }
    return localDb.getPackage(id);
  },
  createPackage: async (pkg: any) => {
    if (isMongo && MongoPackageModel) {
      const doc = new MongoPackageModel(pkg);
      await doc.save();
      return doc.toJSON();
    }
    return localDb.createPackage(pkg);
  },
  updatePackage: async (id: string, updates: any) => {
    if (isMongo && MongoPackageModel && id.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await MongoPackageModel.findByIdAndUpdate(id, updates, { new: true });
      return doc ? doc.toJSON() : null;
    }
    return localDb.updatePackage(id, updates);
  },
  deletePackage: async (id: string) => {
    if (isMongo && MongoPackageModel && id.match(/^[0-9a-fA-F]{24}$/)) {
      const res = await MongoPackageModel.deleteOne({ _id: id });
      return res.deletedCount > 0;
    }
    return localDb.deletePackage(id);
  },
  getOrders: async () => {
    if (isMongo && MongoOrderModel) {
      const docs = await MongoOrderModel.find({}).sort({ createdAt: -1 });
      return docs.map((doc: any) => doc.toJSON());
    }
    return localDb.getOrders().slice().reverse();
  },
  createOrder: async (order: any) => {
    if (isMongo && MongoOrderModel) {
      const doc = new MongoOrderModel(order);
      await doc.save();
      return doc.toJSON();
    }
    return localDb.createOrder(order);
  },
  updateOrder: async (id: string, updates: any) => {
    if (isMongo && MongoOrderModel && id.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await MongoOrderModel.findByIdAndUpdate(id, updates, { new: true });
      return doc ? doc.toJSON() : null;
    }
    return localDb.updateOrder(id, updates);
  }
};

// Razorpay Instance Setup
let razorpay: Razorpay | null = null;
const isRazorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET);

if (isRazorpayConfigured) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_SECRET!,
    });
    console.log("Razorpay SDK client loaded successfully.");
  } catch (err) {
    console.warn("Failed to initialize Razorpay SDK. Falling back to robust simulation.", err);
  }
} else {
  console.log("Razorpay keys not defined in environment. Running integrated payment simulator on the server.");
}

// Initialize Database connection on start
setupDatabaseAndModels().catch(console.error);

// API Endpoints
app.get("/api/config", (req, res) => {
  res.json({
    isRazorpayActive: isRazorpayConfigured && razorpay !== null,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_keys"
  });
});

// GET Packages
app.get("/api/packages", async (req, res) => {
  try {
    const list = await db.getPackages();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Package (Admin)
app.post("/api/packages", async (req, res) => {
  try {
    const { name, diamonds, bonus, price, image } = req.body;
    if (!name || !diamonds || !price) {
      res.status(400).json({ error: "Name, diamonds and price are required." });
      return;
    }
    const newPkg = await db.createPackage({
      name,
      diamonds: Number(diamonds),
      bonus: Number(bonus || 0),
      price: Number(price),
      image: image || "ruby"
    });
    res.status(201).json(newPkg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Package (Admin)
app.put("/api/packages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, diamonds, bonus, price, image } = req.body;
    const updated = await db.updatePackage(id, {
      name,
      diamonds: Number(diamonds),
      bonus: Number(bonus || 0),
      price: Number(price),
      image
    });
    if (!updated) {
      res.status(404).json({ error: "Package not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Package (Admin)
app.delete("/api/packages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deletePackage(id);
    if (!deleted) {
      res.status(404).json({ error: "Package not found." });
      return;
    }
    res.json({ success: true, message: "Package deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Orders (Admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Order Status (Admin or callback)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentId } = req.body;
    const updated = await db.updateOrder(id, { status, razorpayPaymentId: paymentId });
    if (!updated) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Player Character UID
app.get("/api/verify-player/:uid", (req, res) => {
  const { uid } = req.params;
  if (!uid || uid.trim().length < 5) {
    res.status(400).json({ exists: false, nickname: "", error: "UID must be at least 5 character length." });
    return;
  }

  // Handle a dynamic deterministic nickname lookup
  const sanUid = uid.trim();
  const digits = sanUid.replace(/[^0-9]/g, "");
  
  // 5% chance of failure if length of digits ends in '99' to simulate lookup failure, else succeed
  if (digits.endsWith("99")) {
    res.json({ exists: false, nickname: "", error: "Player Account Not Found. Please verify standard UID." });
    return;
  }

  const adjectives = ["Epic", "Pro", "Neon", "Shadow", "Toxic", "Silent", "Slayer", "Alpha", "Omega", "Vortex", "Savage", "Ghost", "Titan", "Zero", "Nexus"];
  const nouns = ["Gamer", "Assassin", "Hunter", "Beast", "Rebel", "Sniper", "Gladiator", "Rider", "Knight", "Ranger", "Squire", "Warlord", "Overlord", "Demon"];
  
  let hashCode = 0;
  for (let i = 0; i < sanUid.length; i++) {
    hashCode = sanUid.charCodeAt(i) + ((hashCode << 5) - hashCode);
  }
  
  const adjIdx = Math.abs(hashCode) % adjectives.length;
  const nounIdx = Math.abs(hashCode + 17) % nouns.length;
  
  const nickname = `⚡${adjectives[adjIdx]}_${nouns[nounIdx]}⚡`;
  res.json({ exists: true, nickname, uid: sanUid });
});

// Create Razorpay Order
app.post("/api/create-razorpay-order", async (req, res) => {
  try {
    const { uid, nickname, packageId, packageName, diamonds, bonus, price, quantity, paymentMethod } = req.body;
    
    if (!uid || !packageId || !price || !quantity) {
      res.status(400).json({ error: "Missing checkout parameters" });
      return;
    }

    const totalAmount = Number(price) * Number(quantity);

    // Store a pending local order record
    const localOrder = await db.createOrder({
      uid,
      nickname: nickname || "Player Account",
      packageId,
      packageName,
      diamonds: Number(diamonds),
      bonus: Number(bonus),
      price: Number(price),
      quantity: Number(quantity),
      totalAmount,
      paymentMethod,
      status: "pending"
    });

    if (razorpay && isRazorpayConfigured) {
      // Activating standard Razorpay billing
      const options = {
        amount: Math.round(totalAmount * 100), // convert to paisa
        currency: "INR",
        receipt: `receipt_${localOrder.id}`,
        payment_capture: 1
      };
      
      const rzpOrder = await razorpay.orders.create(options);
      
      // Update order with Razorpay Order ID
      await db.updateOrder(localOrder.id, { razorpayOrderId: rzpOrder.id });
      
      res.json({
        isSimulated: false,
        orderId: localOrder.id,
        razorpayOrderId: rzpOrder.id,
        amount: options.amount,
        currency: options.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } else {
      // Simulated sandbox mode
      const mockRzpOrderId = `rzp_mock_${Math.random().toString(36).substring(2, 11)}`;
      
      await db.updateOrder(localOrder.id, { razorpayOrderId: mockRzpOrderId });
      
      res.json({
        isSimulated: true,
        orderId: localOrder.id,
        razorpayOrderId: mockRzpOrderId,
        amount: totalAmount * 100,
        currency: "INR"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Payment
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isSimulated } = req.body;

    if (!orderId) {
      res.status(400).json({ success: false, error: "Missing Order ID parameter." });
      return;
    }

    if (isSimulated || !isRazorpayConfigured || !razorpay) {
      // Complete mock validation
      await db.updateOrder(orderId, {
        status: 'success',
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Math.random().toString(36).substring(2, 11)}`
      });
      res.json({ success: true, verified: true, message: "Order processed successfully." });
      return;
    }

    // Verify cryptographic signature of live Razorpay request
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET!)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature === razorpaySignature) {
      await db.updateOrder(orderId, {
        status: "success",
        razorpayPaymentId
      });
      res.json({ success: true, verified: true, message: "Signature verification successfully passed." });
    } else {
      await db.updateOrder(orderId, { status: "failed" });
      res.status(400).json({ success: false, verified: false, error: "Signature cryptographic discrepancy. Re-try payment." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and ready at client ingress endpoint: http://localhost:${PORT}`);
  });
}

startServer();
