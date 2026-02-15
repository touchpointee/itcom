import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Bill } from "@/models/Bill";
import { PaymentMethod } from "@/models/PaymentMethod";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const bill = await Bill.findById(id)
      .populate({ path: "customer", select: "name phone email address", strictPopulate: false })
      .populate("items.product", "name")
      .lean();
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Resolve payment method name by id
    const rawPm = (bill as Record<string, unknown>).paymentMethod;
    if (rawPm != null) {
      const pmId = typeof rawPm === "object" && rawPm !== null && "_id" in rawPm ? (rawPm as { _id: unknown })._id : rawPm;
      const pmIdStr = String(pmId);
      if (mongoose.Types.ObjectId.isValid(pmIdStr)) {
        const pm = await PaymentMethod.findById(pmIdStr).select("name").lean();
        if (pm) {
          (bill as Record<string, unknown>).paymentMethod = { _id: pm._id, name: pm.name };
        }
      }
    }

    return NextResponse.json(bill);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
