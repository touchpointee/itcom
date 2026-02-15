"use client";

import { useEffect, useState, useMemo } from "react";

const VAT_RATE = 5;

function amountInWords(amount: number): string {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  function toWords(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return (tens[Math.floor(n / 10)] + " " + ones[n % 10]).trim();
    if (n < 1000) return (ones[Math.floor(n / 100)] ? ones[Math.floor(n / 100)] + " hundred " : "") + (n % 100 ? toWords(n % 100) : "").trim();
    if (n < 100000) return (toWords(Math.floor(n / 1000)) + " thousand " + toWords(n % 1000)).trim();
    if (n < 10000000) return (toWords(Math.floor(n / 100000)) + " lakh " + toWords(n % 100000)).trim();
    return (toWords(Math.floor(n / 10000000)) + " crore " + toWords(n % 10000000)).trim();
  }
  const wholeStr = whole === 0 ? "zero" : toWords(whole);
  const rupees = wholeStr + " rupee" + (whole !== 1 ? "s" : "");
  const paiseStr = paise > 0 ? " and " + toWords(paise) + " paise" : "";
  return rupees + paiseStr + " only";
}

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

interface BillPaymentMethod {
  _id: string;
  name: string;
}

interface PrintBill {
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

function BillPrintPopup({
  billId,
  onClose,
}: {
  billId: string;
  onClose: () => void;
}) {
  const [bill, setBill] = useState<PrintBill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bills/${billId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bill");
        return r.json();
      })
      .then(setBill)
      .catch(() => setBill(null))
      .finally(() => setLoading(false));
  }, [billId]);

  const dateStr = bill
    ? new Date(bill.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-[210mm] max-h-[90dvh] overflow-y-auto flex flex-col safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="no-print flex items-center justify-between gap-2 p-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Bill</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || !bill}
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {loading && (
            <p className="text-slate-500 text-sm py-8">Loading bill...</p>
          )}
          {!loading && !bill && (
            <p className="text-red-600 text-sm py-8">Could not load bill.</p>
          )}
          {!loading && bill && (
            <div className="bill-print-wrapper">
              <div className="bill-a4 mx-auto w-full max-w-[210mm] rounded-lg border border-slate-200 bg-white px-6 py-8 shadow-sm">
                <div className="mb-6 border-b border-slate-200 pb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800">Shop Manager</h1>
                  <p className="mt-1 text-sm text-slate-500">Tax Invoice / Bill</p>
                </div>
                <div className="mb-6 flex flex-wrap justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Bill No</span>
                    <p className="text-lg font-semibold text-slate-800">{bill.billNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-500">Date</span>
                    <p className="text-slate-800">{dateStr}</p>
                    <div className="mt-2">
                      <span className="text-sm font-medium text-slate-500">Payment method: </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {(bill.paymentMethod && typeof bill.paymentMethod === "object" && (bill.paymentMethod as { name?: string }).name) || "—"}
                      </span>
                    </div>
                  </div>
                </div>
                {bill.customer && (
                  <div className="mb-6 rounded border border-slate-200 bg-slate-50/50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill To</div>
                    <p className="mt-1 font-medium text-slate-800">{bill.customer.name}</p>
                    <p className="text-sm text-slate-600">{bill.customer.phone}</p>
                    {bill.customer.email && <p className="text-sm text-slate-600">{bill.customer.email}</p>}
                    {bill.customer.address && <p className="mt-1 text-sm text-slate-600">{bill.customer.address}</p>}
                  </div>
                )}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="py-3 text-left font-semibold text-slate-700">#</th>
                      <th className="py-3 text-left font-semibold text-slate-700">Item</th>
                      <th className="py-3 text-right font-semibold text-slate-700">Qty</th>
                      <th className="py-3 text-right font-semibold text-slate-700">Rate (₹)</th>
                      <th className="py-3 text-right font-semibold text-slate-700">Product discount (₹)</th>
                      <th className="py-3 text-right font-semibold text-slate-700">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, i) => {
                      const discount = Number(item.discount) || 0;
                      return (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-600">{i + 1}</td>
                          <td className="py-2.5 font-medium text-slate-800">{item.name}</td>
                          <td className="py-2.5 text-right text-slate-600">{item.quantity}</td>
                          <td className="py-2.5 text-right text-slate-600">{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right text-slate-600">
                            {discount > 0 ? `−₹${discount.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-800">{item.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-xs space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{bill.subtotal.toFixed(2)}</span>
                    </div>
                    {(Number(bill.wholeDiscount) || 0) > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Whole discount</span>
                        <span>−₹{Number(bill.wholeDiscount).toFixed(2)}</span>
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
                <div className="mt-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-500">Amount in words: </span>
                  {amountInWords(bill.total)}
                </div>
                <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
                  Thank you for your business
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // per-line discount in ₹
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface PaymentMethod {
  _id: string;
  name: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [billingType, setBillingType] = useState<"walk_in" | "delivery">("walk_in");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [withVat, setWithVat] = useState(true);
  const [wholeDiscount, setWholeDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [printedBillId, setPrintedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data) => setPaymentMethods(Array.isArray(data) ? data : []));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products.slice(0, 50);
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 50);
  }, [products, search]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 30);
    const s = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.phone.includes(s) ||
          (c.email && c.email.toLowerCase().includes(s))
      )
      .slice(0, 30);
  }, [customers, customerSearch]);

  function addToCart(p: Product, qty: number = 1) {
    if (p.stock < qty) {
      setError(`Only ${p.stock} in stock`);
      return;
    }
    setError("");
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === p._id);
      const newQty = (existing?.quantity ?? 0) + qty;
      if (newQty > p.stock) {
        setError(`Only ${p.stock} in stock`);
        return prev;
      }
      if (existing) {
        return prev.map((c) =>
          c.product._id === p._id ? { ...c, quantity: newQty } : c
        );
      }
      return [...prev, { product: p, quantity: qty, discount: 0 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.product._id !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.product.stock) return c;
          return { ...c, quantity: newQty };
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function setItemDiscount(productId: string, discount: number) {
    const value = Math.max(0, Math.round(discount * 100) / 100);
    setCart((prev) =>
      prev.map((c) =>
        c.product._id === productId ? { ...c, discount: value } : c
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product._id !== productId));
  }

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (s, c) => s + (c.product.sellingPrice * c.quantity - (c.discount || 0)),
        0
      ),
    [cart]
  );
  const subtotalAfterWholeDiscount = Math.max(0, subtotal - wholeDiscount);
  const vatAmount = withVat
    ? (subtotalAfterWholeDiscount * VAT_RATE) / 100
    : 0;
  const total = subtotalAfterWholeDiscount + vatAmount;

  async function saveBill() {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((c) => ({
          productId: c.product._id,
          quantity: c.quantity,
          discount: c.discount || 0,
        })),
        withVat: withVat,
        wholeDiscount: wholeDiscount,
        customerId: selectedCustomerId || undefined,
        paymentMethodId: selectedPaymentMethodId ? String(selectedPaymentMethodId) : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save bill");
      return;
    }
    setCart([]);
    setPrintedBillId(data._id);
  }

  return (
    <div className="flex flex-col min-h-0">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl md:mb-6">POS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-[200px] lg:min-h-0">
          <input
            type="text"
            placeholder="Search product by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-md mb-3 text-base md:text-sm"
          />
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-1 min-h-0 flex flex-col max-h-[40vh] lg:max-h-none">
            <div className="p-2 border-b border-slate-200 font-medium text-slate-700 text-sm">
              Products
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filtered.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-slate-100"
                  >
                    <div className="font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-sm text-slate-500">₹{p.sellingPrice} · Stock: {p.stock}</div>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="text-slate-500 text-sm p-4">No products match.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden min-h-0 lg:min-h-[400px]">
          <div className="p-3 border-b border-slate-200 font-medium text-slate-700 shrink-0">
            Cart
          </div>
          <div className="border-b border-slate-200 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500">Billed as</span>
                <div className="flex rounded border border-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setBillingType("walk_in")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${billingType === "walk_in"
                        ? "bg-primary-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    Walk in
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType("delivery")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${billingType === "delivery"
                        ? "bg-primary-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    Delivery
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
                  setShowAddCustomer(true);
                }}
                className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 h-[34px] flex items-center"
              >
                Add customer
              </button>
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-slate-500 mb-1">Customer</div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={
                    selectedCustomerId
                      ? (() => {
                        const c = customers.find((x) => x._id === selectedCustomerId);
                        return c ? `${c.name} — ${c.phone}` : "";
                      })()
                      : customerSearch
                  }
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomerId(null);
                    setCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm pr-8"
                />
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
                    aria-label="Clear customer"
                  >
                    ×
                  </button>
                )}
              </div>
              {customerDropdownOpen && !selectedCustomerId && (
                <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg py-1">
                  {filteredCustomers.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500">
                      {customerSearch.trim() ? "No customers found" : "Type to search"}
                    </li>
                  ) : (
                    filteredCustomers.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex flex-col"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedCustomerId(c._id);
                            setCustomerSearch("");
                            setCustomerDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-slate-800">{c.name}</span>
                          <span className="text-xs text-slate-500">{c.phone}</span>
                        </button>
                      </li>
                    ))
                  )}
                  <li className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCustomerDropdownOpen(false);
                        setNewCustomerForm({
                          name: customerSearch.trim() || "",
                          phone: "",
                          email: "",
                          address: "",
                        });
                        setShowAddCustomer(true);
                      }}
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary-100 text-primary-600 text-xs">+</span>
                      Add customer
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm">Cart is empty.</p>
            ) : (
              cart.map((c) => {
                const lineTotal = Math.max(
                  0,
                  c.product.sellingPrice * c.quantity - (c.discount || 0)
                );
                return (
                  <div
                    key={c.product._id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-100"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 truncate">
                        {c.product.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ₹{c.product.sellingPrice} × {c.quantity}
                        {(c.discount || 0) > 0 && (
                          <span className="text-amber-600">
                            {" "}
                            − ₹{(c.discount || 0).toFixed(2)}
                          </span>
                        )}{" "}
                        = ₹{lineTotal.toFixed(2)}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-400">Discount ₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={c.discount || ""}
                          onChange={(e) =>
                            setItemDiscount(
                              c.product._id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQty(c.product._id, -1)}
                        className="w-7 h-7 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{c.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(c.product._id, 1)}
                        disabled={c.quantity >= c.product.stock}
                        className="w-7 h-7 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.product._id)}
                        className="ml-1 text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-slate-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={withVat}
                onChange={(e) => setWithVat(e.target.checked)}
              />
              <span className="text-sm">With VAT (5%)</span>
            </label>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600">Whole discount ₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={wholeDiscount || ""}
                onChange={(e) =>
                  setWholeDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                }
                placeholder="0"
                className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-slate-800"
              />
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {wholeDiscount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Whole discount</span>
                  <span>−₹{wholeDiscount.toFixed(2)}</span>
                </div>
              )}
              {withVat && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT (5%)</span>
                  <span>₹{vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment method</label>
              <select
                value={selectedPaymentMethodId ?? ""}
                onChange={(e) => setSelectedPaymentMethodId(e.target.value || null)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm._id} value={pm._id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={saveBill}
              disabled={saving || cart.length === 0}
              className="w-full py-3.5 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 touch-manipulation safe-area-pb"
            >
              {saving ? "Saving..." : "Save Bill"}
            </button>
          </div>
        </div>
      </div>

      {printedBillId && (
        <BillPrintPopup
          billId={printedBillId}
          onClose={() => setPrintedBillId(null)}
        />
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-t-xl sm:rounded-xl bg-white p-6 shadow-xl safe-area-pb">
            <h2 className="mb-4 text-lg font-semibold">Add Customer</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) return;
                setSaving(true);
                const res = await fetch("/api/customers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newCustomerForm),
                });
                const data = await res.json();
                setSaving(false);
                if (!res.ok) {
                  setError(data.error || "Failed to add customer");
                  return;
                }
                setCustomers((prev) => [...prev, data]);
                setSelectedCustomerId(data._id);
                setShowAddCustomer(false);
                setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
                <input
                  type="text"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) =>
                    setNewCustomerForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 rounded border border-slate-300 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-primary-600 py-2 text-sm text-white disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
