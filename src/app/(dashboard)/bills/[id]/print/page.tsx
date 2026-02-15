"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

interface BillCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  customer?: BillCustomer | null;
  items: BillItem[];
  withVat: boolean;
  subtotal: number;
  wholeDiscount?: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  createdAt: string;
}

export default function BillPrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bills/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bill");
        return r.json();
      })
      .then(setBill)
      .catch(() => setError("Bill not found"))
      .finally(() => setLoading(false));
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="bill-print-wrapper flex min-h-[80vh] items-center justify-center">
        <p className="text-slate-500">Loading bill...</p>
      </div>
    );
  }
  if (error || !bill) {
    return (
      <div className="bill-print-wrapper flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Bill not found"}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded bg-slate-200 px-4 py-2 text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  const dateStr = new Date(bill.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bill-print-wrapper">
      {/* Screen-only: back + print buttons */}
      <div className="no-print mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Print Bill
        </button>
      </div>

      {/* A4 Bill content */}
      <div className="bill-a4 mx-auto w-full max-w-[210mm] rounded-lg border border-slate-200 bg-white px-6 py-8 shadow-sm print:max-w-none print:border-0 print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Mobile Shop POS</h1>
          <p className="mt-1 text-sm text-slate-500">Tax Invoice / Bill</p>
        </div>

        {/* Bill number & date */}
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-slate-500">Bill No</span>
            <p className="text-lg font-semibold text-slate-800">{bill.billNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-500">Date</span>
            <p className="text-slate-800">{dateStr}</p>
          </div>
        </div>

        {/* Customer */}
        {bill.customer && (
          <div className="mb-6 rounded border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill To</div>
            <p className="mt-1 font-medium text-slate-800">{bill.customer.name}</p>
            <p className="text-sm text-slate-600">{bill.customer.phone}</p>
            {bill.customer.email && (
              <p className="text-sm text-slate-600">{bill.customer.email}</p>
            )}
            {bill.customer.address && (
              <p className="mt-1 text-sm text-slate-600">{bill.customer.address}</p>
            )}
          </div>
        )}

        {/* Items table */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-3 text-left font-semibold text-slate-700">#</th>
              <th className="py-3 text-left font-semibold text-slate-700">Item</th>
              <th className="py-3 text-right font-semibold text-slate-700">Qty</th>
              <th className="py-3 text-right font-semibold text-slate-700">Rate (₹)</th>
              <th className="py-3 text-right font-semibold text-slate-700">Discount</th>
              <th className="py-3 text-right font-semibold text-slate-700">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => {
              const discount = item.discount ?? 0;
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-600">{i + 1}</td>
                  <td className="py-2.5 font-medium text-slate-800">{item.name}</td>
                  <td className="py-2.5 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-600">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-600">
                    {discount > 0 ? `−${discount.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-800">{item.total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.wholeDiscount != null && bill.wholeDiscount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount</span>
                <span>−₹{bill.wholeDiscount.toFixed(2)}</span>
              </div>
            )}
            {bill.withVat && (
              <div className="flex justify-between text-slate-600">
                <span>VAT ({bill.vatRate}%)</span>
                <span>₹{bill.vatAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-bold text-slate-800">
              <span>Total</span>
              <span>₹{bill.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Thank you for your business
        </div>
      </div>
    </div>
  );
}
