"use client";

import { useEffect, useState } from "react";

interface PaymentMethod {
  _id: string;
  name: string;
  order?: number;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data) => {
        setMethods(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setName("");
    setError("");
    setModal("add");
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setName(m.name);
    setError("");
    setModal("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = editing ? `/api/payment-methods/${editing._id}` : "/api/payment-methods";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setModal(null);
    load();
  }

  async function handleDelete(m: PaymentMethod) {
    if (!confirm(`Delete payment method "${m.name}"?`)) return;
    const res = await fetch(`/api/payment-methods/${m._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Payment methods</h1>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Add payment method
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[280px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="p-3 font-medium text-slate-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{m.name}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="text-primary-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
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
        {!loading && methods.length === 0 && (
          <p className="p-6 text-slate-500">No payment methods yet. Add one to use in POS.</p>
        )}
      </div>

      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-sm w-full max-h-[85dvh] overflow-y-auto p-6 safe-area-pb">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit payment method" : "Add payment method"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cash, Card, UPI"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-md"
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
      )}
    </div>
  );
}
