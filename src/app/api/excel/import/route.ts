import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import * as XLSX from "xlsx";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buf, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    await connectDB();
    const created: unknown[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.name ?? row.Name ?? "").trim();
      const categoryId = row.categoryId ?? row.category ?? "";
      const distributorId = row.distributorId ?? row.distributor ?? "";
      const purchasePrice = Number(row.purchasePrice ?? row.purchase_price ?? 0);
      const sellingPrice = Number(row.sellingPrice ?? row.selling_price ?? 0);
      const stock = Number(row.stock ?? 0) || 0;
      const imei = row.imei ? String(row.imei).trim() : undefined;

      if (!name) {
        errors.push(`Row ${i + 2}: name required`);
        continue;
      }
      if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
        errors.push(`Row ${i + 2}: invalid categoryId`);
        continue;
      }
      if (!mongoose.Types.ObjectId.isValid(String(distributorId))) {
        errors.push(`Row ${i + 2}: invalid distributorId`);
        continue;
      }
      if (purchasePrice < 0 || sellingPrice < 0) {
        errors.push(`Row ${i + 2}: invalid prices`);
        continue;
      }

      const product = await Product.create({
        name,
        category: categoryId,
        distributor: distributorId,
        purchasePrice,
        sellingPrice,
        stock,
        imei,
      });
      created.push({ _id: product._id, name: product.name });
    }

    return NextResponse.json({
      imported: created.length,
      errors: errors.length ? errors : undefined,
      created,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
