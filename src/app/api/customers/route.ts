import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Customer } from "@/models/Customer";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const customers = await Customer.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(customers);
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
    const { name, phone, email, address } = body;
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "name and phone required" }, { status: 400 });
    }
    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
    });
    return NextResponse.json(customer);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
