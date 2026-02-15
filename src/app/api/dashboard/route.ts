import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Bill } from "@/models/Bill";
import { Service } from "@/models/Service";
import { Product } from "@/models/Product";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayBills, monthBills, totalBillsCount, pendingServices, lowStockProducts] = await Promise.all([
      Bill.find({ createdAt: { $gte: startOfToday, $lte: endOfToday } }).select("total").lean(),
      Bill.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).select("total").lean(),
      Bill.countDocuments(),
      Service.countDocuments({ status: "Pending" }),
      Product.countDocuments({ stock: { $lte: 5 } }),
    ]);

    const todaySales = todayBills.reduce((s, b) => s + b.total, 0);
    const monthlySales = monthBills.reduce((s, b) => s + b.total, 0);

    return NextResponse.json({
      todaySales: Math.round(todaySales * 100) / 100,
      monthlySales: Math.round(monthlySales * 100) / 100,
      totalBillsCount,
      pendingServices,
      lowStockProducts,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
