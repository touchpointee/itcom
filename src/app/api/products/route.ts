import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Distributor } from "@/models/Distributor";
import mongoose from "mongoose";

function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const distributor = searchParams.get("distributor") ?? "";
    const lowStock = searchParams.get("lowStock") === "true";

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category && isValidObjectId(category)) filter.category = category;
    if (distributor && isValidObjectId(distributor)) filter.distributor = distributor;
    if (lowStock) filter.stock = { $lte: 5 };

    // Fetch without populate so invalid refs (e.g. "NEW_PHONE") don't cause CastError
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    const categoryIdStrs = [...new Set(products.map((p) => p.category).filter((id) => id != null && isValidObjectId(String(id))).map(String))];
    const distributorIdStrs = [...new Set(products.map((p) => p.distributor).filter((id) => id != null && isValidObjectId(String(id))).map(String))];

    const [categories, distributors] = await Promise.all([
      categoryIdStrs.length ? Category.find({ _id: { $in: categoryIdStrs } }).select("name").lean() : [],
      distributorIdStrs.length ? Distributor.find({ _id: { $in: distributorIdStrs } }).select("name").lean() : [],
    ]);
    const categoryMap = Object.fromEntries((categories as { _id: mongoose.Types.ObjectId; name: string }[]).map((c) => [String(c._id), c]));
    const distributorMap = Object.fromEntries((distributors as { _id: mongoose.Types.ObjectId; name: string }[]).map((d) => [String(d._id), d]));

    const result = products.map((p) => ({
      ...p,
      category: p.category ? categoryMap[String(p.category)] ?? { _id: p.category, name: String(p.category) } : null,
      distributor: p.distributor ? distributorMap[String(p.distributor)] ?? { _id: p.distributor, name: String(p.distributor) } : null,
    }));
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const body = await request.json();
    const { name, category, distributor, purchasePrice, sellingPrice, stock, imei } = body;
    if (!name || !category || !distributor || purchasePrice == null || sellingPrice == null || stock == null) {
      return NextResponse.json(
        { error: "name, category, distributor, purchasePrice, sellingPrice, stock required" },
        { status: 400 }
      );
    }
    const product = await Product.create({
      name: name.trim(),
      category,
      distributor,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      imei: imei?.trim() || undefined,
    });
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
