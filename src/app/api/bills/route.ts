import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Bill } from "@/models/Bill";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

const VAT_RATE = 5;

async function getNextBillNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const last = await Bill.findOne({ billNumber: new RegExp(`^B${today}`) })
    .sort({ billNumber: -1 })
    .select("billNumber")
    .lean();
  const nextNum = last
    ? parseInt(last.billNumber.slice(-4), 10) + 1
    : 1;
  return `B${today}${String(nextNum).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const billNumber = searchParams.get("billNumber") ?? "";
    const date = searchParams.get("date") ?? "";

    const filter: Record<string, unknown> = {};
    if (billNumber) filter.billNumber = { $regex: billNumber, $options: "i" };
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.createdAt = { $gte: start, $lte: end };
    }

    const bills = await Bill.find(filter)
      .populate({ path: "customer", select: "name phone email address", strictPopulate: false })
      .populate({ path: "paymentMethod", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(bills);
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
    const { items, withVat, wholeDiscount: reqWholeDiscount, customerId, paymentMethodId: paymentMethodIdRaw } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    const wholeDiscount = Math.max(0, Number(reqWholeDiscount) || 0);

    const billItems: { product: mongoose.Types.ObjectId; name: string; quantity: number; unitPrice: number; discount: number; total: number }[] = [];
    for (const item of items) {
      const { productId, quantity, discount: itemDiscount = 0 } = item;
      if (!productId || quantity == null || quantity < 1) continue;
      const product = await Product.findById(productId).lean();
      if (!product) continue;
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }
      const unitPrice = product.sellingPrice;
      const lineDiscount = Math.max(0, Number(itemDiscount) || 0);
      const total = Math.max(0, unitPrice * quantity - lineDiscount);
      billItems.push({
        product: product._id,
        name: product.name,
        quantity,
        unitPrice,
        discount: lineDiscount,
        total,
      });
    }
    if (billItems.length === 0) {
      return NextResponse.json({ error: "No valid items" }, { status: 400 });
    }

    const subtotal = billItems.reduce((s, i) => s + i.total, 0);
    const subtotalAfterDiscount = Math.max(0, subtotal - wholeDiscount);
    const vatAmount = withVat ? (subtotalAfterDiscount * VAT_RATE) / 100 : 0;
    const total = subtotalAfterDiscount + vatAmount;
    const billNumber = await getNextBillNumber();

    const billPayload: Record<string, unknown> = {
      billNumber,
      items: billItems,
      withVat: !!withVat,
      subtotal,
      wholeDiscount,
      vatRate: VAT_RATE,
      vatAmount,
      total,
    };
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      billPayload.customer = customerId;
    }
    // Always persist payment method when a valid id is sent
    const paymentMethodId = paymentMethodIdRaw != null ? String(paymentMethodIdRaw).trim() : "";
    if (paymentMethodId && mongoose.Types.ObjectId.isValid(paymentMethodId)) {
      billPayload.paymentMethod = new mongoose.Types.ObjectId(paymentMethodId);
    }
    const bill = await Bill.create(billPayload);

    for (const item of billItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    return NextResponse.json(bill);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
