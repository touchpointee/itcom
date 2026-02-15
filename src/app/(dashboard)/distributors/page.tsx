"use client";

import { useEffect, useState } from "react";

interface Distributor {
  _id: string;
  name: string;
  phone: string;
  address: string;
  vatNumber?: string;
}

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", vatNumber: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/distributors")
      .then((r) => r.json())
      .then((data) => {
        setDistributors(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", vatNumber: "" });
    setError("");
    setModal("add");
  }

  function openEdit(d: Distributor) {
    setEditing(d);
    setForm({
      name: d.name,
      phone: d.phone,
      address: d.address,
      vatNumber: d.vatNumber ?? "",
    });
    setError("");
    setModal("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = editing ? `/api/distributors/${editing._id}` : "/api/distributors";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function handleDelete(d: Distributor) {
    if (!confirm(`Delete distributor "${d.name}"?`)) return;
    const res = await fetch(`/api/distributors/${d._id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Distributors</h1>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Add Distributor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="text-left p-3 font-medium text-slate-700">Phone</th>
                  <th className="text-left p-3 font-medium text-slate-700">Address</th>
                  <th className="text-left p-3 font-medium text-slate-700">VAT No</th>
                  <th className="p-3 font-medium text-slate-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributors.map((d) => (
                  <tr key={d._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{d.name}</td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3">{d.address}</td>
                    <td className="p-3">{d.vatNumber ?? "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="text-primary-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
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
        {!loading && distributors.length === 0 && (
          <p className="p-6 text-slate-500">No distributors yet.</p>
        )}
      </div>

      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[85dvh] overflow-y-auto p-6 safe-area-pb">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Distributor" : "Add Distributor"}</h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">VAT Number (optional)</label>
                <input
                  type="text"
                  value={form.vatNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 border rounded-md"
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
