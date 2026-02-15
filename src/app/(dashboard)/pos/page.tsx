"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const VAT_RATE = 5;

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

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
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

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
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
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save bill");
      return;
    }
    setCart([]);
    router.push(`/bills?id=${data._id}`);
  }

  return (
    <div className="flex flex-col min-h-0">
      <h1 className="text-xl font-semibold text-slate-800 mb-3 md:text-2xl md:mb-4">POS</h1>

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
          <div className="border-b border-slate-200 p-3 space-y-2">
            <div className="text-xs font-medium text-slate-500">Customer</div>
            <div className="flex gap-2">
              <select
                value={selectedCustomerId ?? ""}
                onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                onFocus={() => setCustomerSearch("")}
                className="flex-1 min-w-0 rounded border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">Walk-in</option>
                {filteredCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
                  setShowAddCustomer(true);
                }}
                className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Add
              </button>
            </div>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
            />
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
