"use client";

import { useEffect, useRef, useState } from "react";

interface Category {
  _id: string;
  name: string;
}
interface Distributor {
  _id: string;
  name: string;
}
interface Product {
  _id: string;
  name: string;
  category: Category | string;
  distributor: Distributor | string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  imei?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [distributorFilter, setDistributorFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | "stock" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    distributor: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    imei: "",
  });
  const [stockQty, setStockQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  function loadProducts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (distributorFilter) params.set("distributor", distributorFilter);
    if (lowStockOnly) params.set("lowStock", "true");
    setLoading(true);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); setSelectedIds(new Set()); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/distributors").then((r) => r.json()),
    ]).then(([cat, dist]) => {
      setCategories(cat);
      setDistributors(dist);
    });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter, distributorFilter, lowStockOnly]);

  function openAdd() {
    setForm({
      name: "",
      category: categories[0]?._id ?? "",
      distributor: distributors[0]?._id ?? "",
      purchasePrice: "",
      sellingPrice: "",
      stock: "",
      imei: "",
    });
    setEditing(null);
    setError("");
    setModal("add");
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      category: typeof p.category === "object" && p.category ? p.category._id : p.category,
      distributor: typeof p.distributor === "object" && p.distributor ? p.distributor._id : p.distributor,
      purchasePrice: String(p.purchasePrice),
      sellingPrice: String(p.sellingPrice),
      stock: String(p.stock),
      imei: p.imei ?? "",
    });
    setError("");
    setModal("edit");
  }

  function openStock(p: Product) {
    setStockProduct(p);
    setStockQty("");
    setError("");
    setModal("stock");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = editing ? `/api/products/${editing._id}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const body = {
      name: form.name.trim(),
      category: form.category,
      distributor: form.distributor,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stock: Number(form.stock),
      imei: form.imei.trim() || undefined,
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }
    setModal(null);
    loadProducts();
  }

  async function handleStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stockProduct) return;
    setError("");
    setSaving(true);
    const res = await fetch("/api/products/stock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: stockProduct._id, quantity: Number(stockQty) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setModal(null);
    setStockProduct(null);
    loadProducts();
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p._id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(p._id); return n; });
      loadProducts();
    }
  }

  const allIds = products.map((p) => p._id);
  const allSelected = products.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (!someSelected || !confirm(`Delete ${selectedIds.size} selected product(s)?`)) return;
    setSaving(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => fetch(`/api/products/${id}`, { method: "DELETE" })));
    setSelectedIds(new Set());
    setSaving(false);
    loadProducts();
  }

  const catName = (p: Product) => (typeof p.category === "object" ? p.category?.name : "-");
  const distName = (p: Product) => (typeof p.distributor === "object" ? p.distributor?.name : "-");

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Products</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 sm:flex-none px-3 py-2 border border-slate-300 rounded-md text-sm sm:w-48"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={distributorFilter}
            onChange={(e) => setDistributorFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All distributors</option>
            {distributors.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Low stock
          </label>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {someSelected && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
          <span className="font-medium text-slate-700">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-primary-600 hover:underline"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={saving}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {saving ? "Deleting..." : "Delete selected"}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-10 p-3">
                    <label className="flex cursor-pointer items-center justify-center">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="text-left p-3 font-medium text-slate-700">Category</th>
                  <th className="text-left p-3 font-medium text-slate-700">Distributor</th>
                  <th className="text-right p-3 font-medium text-slate-700">Purchase</th>
                  <th className="text-right p-3 font-medium text-slate-700">Selling</th>
                  <th className="text-right p-3 font-medium text-slate-700">Stock</th>
                  <th className="text-left p-3 font-medium text-slate-700">IMEI</th>
                  <th className="p-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p._id}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${selectedIds.has(p._id) ? "bg-primary-50/50" : ""}`}
                  >
                    <td className="w-10 p-3">
                      <label className="flex cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{catName(p)}</td>
                    <td className="p-3">{distName(p)}</td>
                    <td className="p-3 text-right">₹{p.purchasePrice}</td>
                    <td className="p-3 text-right">₹{p.sellingPrice}</td>
                    <td className={`p-3 text-right ${p.stock <= 5 ? "text-amber-600 font-medium" : ""}`}>{p.stock}</td>
                    <td className="p-3">{p.imei ?? "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openStock(p)}
                        className="text-primary-600 hover:underline mr-2"
                      >
                        Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-primary-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && products.length === 0 && (
          <p className="p-6 text-slate-500">No products found.</p>
        )}
      </div>

      {modal === "add" || modal === "edit" ? (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[85dvh] overflow-y-auto p-6 safe-area-pb">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Distributor</label>
                <select
                  value={form.distributor}
                  onChange={(e) => setForm((f) => ({ ...f, distributor: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {distributors.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchasePrice}
                    onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sellingPrice}
                    onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IMEI (optional)</label>
                <input
                  type="text"
                  value={form.imei}
                  onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "stock" && stockProduct ? (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-sm w-full max-h-[85dvh] overflow-y-auto p-6 safe-area-pb">
            <h2 className="text-lg font-semibold mb-2">Update Stock: {stockProduct.name}</h2>
            <p className="text-sm text-slate-500 mb-4">Current stock: {stockProduct.stock}. Use +N to add, -N to subtract.</p>
            <form onSubmit={handleStockSubmit} className="space-y-3">
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="e.g. 10 or -5"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setModal(null); setStockProduct(null); }}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
