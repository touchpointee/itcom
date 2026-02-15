import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const products = await Product.find()
      .populate("category", "name")
      .populate("distributor", "name")
      .sort({ name: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "name", key: "name", width: 22 },
      { header: "category", key: "category", width: 18 },
      { header: "distributor", key: "distributor", width: 18 },
      { header: "purchasePrice", key: "purchasePrice", width: 14 },
      { header: "sellingPrice", key: "sellingPrice", width: 14 },
      { header: "stock", key: "stock", width: 8 },
      { header: "imei", key: "imei", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const p of products) {
      const cat = p.category as { name?: string } | null;
      const dist = p.distributor as { name?: string } | null;
      sheet.addRow({
        name: p.name,
        category: cat?.name ?? "",
        distributor: dist?.name ?? "",
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        imei: p.imei ?? "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
