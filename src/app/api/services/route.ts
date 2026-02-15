import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const filter = status ? { status } : {};
    const services = await Service.find(filter)
      .populate({ path: "customer", select: "name phone email address", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(services);
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
    const { customerId, device, issue, status, estimatedCost, finalCost } = body;
    if (!device?.trim() || !issue?.trim()) {
      return NextResponse.json(
        { error: "device, issue required" },
        { status: 400 }
      );
    }
    const payload: Record<string, unknown> = {
      device: device.trim(),
      issue: issue.trim(),
      status: status || "Pending",
      estimatedCost: estimatedCost != null ? Number(estimatedCost) : undefined,
      finalCost: finalCost != null ? Number(finalCost) : undefined,
    };
    if (customerId) payload.customer = customerId;
    const service = await Service.create(payload);
    const populated = await Service.findById(service._id)
      .populate({ path: "customer", select: "name phone email address", strictPopulate: false })
      .lean();
    return NextResponse.json(populated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
