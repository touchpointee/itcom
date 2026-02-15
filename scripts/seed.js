const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mobile_shop_pos";

const UserSchema = new mongoose.Schema(
  { email: String, password: String, name: String },
  { timestamps: true }
);
const CategorySchema = new mongoose.Schema({ name: String }, { timestamps: true });
const DistributorSchema = new mongoose.Schema(
  { name: String, phone: String, address: String, vatNumber: String },
  { timestamps: true }
);
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    distributor: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor" },
    purchasePrice: Number,
    sellingPrice: Number,
    stock: Number,
    imei: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Category = mongoose.model("Category", CategorySchema);
const Distributor = mongoose.model("Distributor", DistributorSchema);
const Product = mongoose.model("Product", ProductSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@example.com" });
  if (existing) {
    console.log("Admin user already exists. Skipping seed.");
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const hashed = await bcrypt.hash("admin123", 10);
  await User.create({ email: "admin@example.com", password: hashed, name: "Admin" });
  console.log("Created admin user: admin@example.com / admin123");

  const cat1 = await Category.create({ name: "Smartphones" });
  const cat2 = await Category.create({ name: "Accessories" });
  const cat3 = await Category.create({ name: "Tablets" });

  const dist1 = await Distributor.create({
    name: "Tech Distributors Ltd",
    phone: "+91 9876543210",
    address: "123 Trade Street, Mumbai",
    vatNumber: "VAT123456",
  });
  const dist2 = await Distributor.create({
    name: "Mobile World Supplies",
    phone: "+91 9123456789",
    address: "45 Commerce Road, Delhi",
    vatNumber: "VAT789012",
  });

  await Product.insertMany([
    { name: "Phone Model A", category: cat1._id, distributor: dist1._id, purchasePrice: 8000, sellingPrice: 9999, stock: 25 },
    { name: "Phone Model B", category: cat1._id, distributor: dist1._id, purchasePrice: 12000, sellingPrice: 14999, stock: 15 },
    { name: "Screen Guard Pack", category: cat2._id, distributor: dist2._id, purchasePrice: 50, sellingPrice: 99, stock: 100 },
    { name: "USB Cable", category: cat2._id, distributor: dist2._id, purchasePrice: 80, sellingPrice: 150, stock: 3 },
    { name: "Tablet X", category: cat3._id, distributor: dist1._id, purchasePrice: 15000, sellingPrice: 18999, stock: 8 },
  ]);
  console.log("Created categories, distributors, and sample products.");

  await mongoose.disconnect();
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
