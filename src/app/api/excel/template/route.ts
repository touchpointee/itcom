import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "name", key: "name", width: 20 },
      { header: "categoryId", key: "categoryId", width: 28 },
      { header: "distributorId", key: "distributorId", width: 28 },
      { header: "purchasePrice", key: "purchasePrice", width: 14 },
      { header: "sellingPrice", key: "sellingPrice", width: 14 },
      { header: "stock", key: "stock", width: 8 },
      { header: "imei", key: "imei", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.addRow({
      name: "Sample Product",
      categoryId: "<paste category _id>",
      distributorId: "<paste distributor _id>",
      purchasePrice: 100,
      sellingPrice: 150,
      stock: 10,
      imei: "",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=products_template.xlsx",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
