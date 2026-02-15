import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const body = await request.json();
    const { productId, quantity } = body;
    if (!productId || quantity == null) {
      return NextResponse.json({ error: "productId and quantity required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    const q = Number(quantity);
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const newStock = Math.max(0, product.stock + q);
    product.stock = newStock;
    await product.save();
    const populated = await Product.findById(product._id)
      .populate("category", "name")
      .populate("distributor", "name")
      .lean();
    return NextResponse.json(populated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
