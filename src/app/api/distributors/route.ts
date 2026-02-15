import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Distributor } from "@/models/Distributor";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const distributors = await Distributor.find().sort({ name: 1 }).lean();
    return NextResponse.json(distributors);
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
    const { name, phone, address, vatNumber } = body;
    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "name, phone, address required" }, { status: 400 });
    }
    const distributor = await Distributor.create({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      vatNumber: vatNumber?.trim() || undefined,
    });
    return NextResponse.json(distributor);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
