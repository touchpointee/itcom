"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface BillItem {
  product: string | { name?: string };
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

interface BillCustomer {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface BillPaymentMethod {
  _id: string;
  name: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  customer?: BillCustomer | null;
  paymentMethod?: BillPaymentMethod | null;
  items: BillItem[];
  withVat: boolean;
  subtotal: number;
  wholeDiscount?: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  createdAt: string;
}

function BillsContent() {
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [billNumber, setBillNumber] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);

  function loadBills() {
    const params = new URLSearchParams();
    if (billNumber) params.set("billNumber", billNumber);
    if (date) params.set("date", date);
    setLoading(true);
    fetch(`/api/bills?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setBills(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadBills();
  }, [billNumber, date]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      fetch(`/api/bills/${id}`)
        .then((r) => r.json())
        .then(setDetailBill)
        .catch(() => setDetailBill(null));
    } else {
      setDetailBill(null);
    }
  }, [searchParams]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">Bills</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Bill number"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            className="min-w-0 flex-1 sm:flex-none px-3 py-2 border border-slate-300 rounded-md text-sm sm:w-40"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
          <button
            type="button"
            onClick={loadBills}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm hover:bg-slate-200"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Bill No</th>
                  <th className="text-left p-3 font-medium text-slate-700">Customer</th>
                  <th className="text-left p-3 font-medium text-slate-700">Payment</th>
                  <th className="text-right p-3 font-medium text-slate-700">Subtotal</th>
                  <th className="text-right p-3 font-medium text-slate-700">VAT</th>
                  <th className="text-right p-3 font-medium text-slate-700">Total</th>
                  <th className="text-left p-3 font-medium text-slate-700">Date</th>
                  <th className="p-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{b.billNumber}</td>
                    <td className="p-3 text-slate-600">
                      {b.customer ? `${b.customer.name} (${b.customer.phone})` : "—"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {b.paymentMethod?.name || "—"}
                    </td>
                    <td className="p-3 text-right">₹{b.subtotal.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{b.vatAmount.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{b.total.toFixed(2)}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setDetailBill(b)}
                        className="text-primary-600 hover:underline mr-2"
                      >
                        View
                      </button>
                      <a
                        href={`/bills/${b._id}/print`}
                        className="text-primary-600 hover:underline"
                      >
                        Print
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && bills.length === 0 && (
          <p className="p-6 text-slate-500">No bills found.</p>
        )}
      </div>

      {detailBill && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setDetailBill(null)}
        >
          <div
            className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold">Bill {detailBill.billNumber}</h2>
              <div className="flex items-center gap-2">
                <a
                  href={`/bills/${detailBill._id}/print`}
                  className="rounded bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Print
                </a>
                <button
                  type="button"
                  onClick={() => setDetailBill(null)}
                  className="text-slate-500 hover:text-slate-700 p-1"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="mb-2 text-sm text-slate-500">
              {new Date(detailBill.createdAt).toLocaleString()}
            </p>
            {detailBill.customer && (
              <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-700">Customer</div>
                <div className="mt-1 text-slate-600">{detailBill.customer.name}</div>
                <div className="text-slate-500">{detailBill.customer.phone}</div>
                {detailBill.customer.email && (
                  <div className="text-slate-500">{detailBill.customer.email}</div>
                )}
                {detailBill.customer.address && (
                  <div className="text-slate-500">{detailBill.customer.address}</div>
                )}
              </div>
            )}
            {detailBill.paymentMethod && (
              <div className="mb-4 text-sm px-1">
                <span className="text-slate-500">Payment Method: </span>
                <span className="font-medium text-slate-700">{detailBill.paymentMethod.name}</span>
              </div>
            )}
            <div className="border border-slate-200 rounded-md overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-right p-2 font-medium">Qty</th>
                    <th className="text-right p-2 font-medium">Price</th>
                    <th className="text-right p-2 font-medium">Discount</th>
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailBill.items.map((item, i) => {
                    const discount = (item as BillItem).discount ?? 0;
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          {discount > 0 ? (
                            <span className="text-amber-600">−₹{discount.toFixed(2)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2 text-right">₹{item.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{detailBill.subtotal.toFixed(2)}</span>
              </div>
              {detailBill.wholeDiscount != null && detailBill.wholeDiscount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Whole discount</span>
                  <span>−₹{detailBill.wholeDiscount.toFixed(2)}</span>
                </div>
              )}
              {detailBill.withVat && (
                <div className="flex justify-between">
                  <span>VAT ({detailBill.vatRate}%)</span>
                  <span>₹{detailBill.vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>₹{detailBill.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <BillsContent />
    </Suspense>
  );
}
