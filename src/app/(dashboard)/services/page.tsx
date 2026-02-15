"use client";

import { useEffect, useState } from "react";

type Status = "Pending" | "In Progress" | "Completed";

interface CustomerRef {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Service {
  _id: string;
  customer?: CustomerRef | string | null;
  device: string;
  issue: string;
  status: Status;
  estimatedCost?: number;
  finalCost?: number;
  createdAt: string;
}

const STATUS_OPTIONS: Status[] = ["Pending", "In Progress", "Completed"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<CustomerRef[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    device: "",
    issue: "",
    status: "Pending" as Status,
    estimatedCost: "",
    finalCost: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
  }, []);

  function load() {
    const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    fetch(`/api/services${params}`)
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  function openAdd() {
    setEditing(null);
    setForm({
      customerId: customers[0]?._id ?? "",
      device: "",
      issue: "",
      status: "Pending",
      estimatedCost: "",
      finalCost: "",
    });
    setError("");
    setModal("add");
  }

  function openEdit(s: Service) {
    setEditing(s);
    const customerId = typeof s.customer === "object" && s.customer ? s.customer._id : s.customer;
    setForm({
      customerId: customerId ?? "",
      device: s.device,
      issue: s.issue,
      status: s.status,
      estimatedCost: s.estimatedCost != null ? String(s.estimatedCost) : "",
      finalCost: s.finalCost != null ? String(s.finalCost) : "",
    });
    setError("");
    setModal("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = editing ? `/api/services/${editing._id}` : "/api/services";
    const method = editing ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      customerId: form.customerId,
      device: form.device.trim(),
      issue: form.issue.trim(),
      status: form.status,
    };
    if (form.estimatedCost !== "") body.estimatedCost = Number(form.estimatedCost);
    if (form.finalCost !== "") body.finalCost = Number(form.finalCost);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  async function updateStatus(s: Service, newStatus: Status) {
    const res = await fetch(`/api/services/${s._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) load();
  }

  function serviceCustomerName(s: Service): string {
    return typeof s.customer === "object" && s.customer ? s.customer.name : "—";
  }
  function serviceCustomerPhone(s: Service): string {
    return typeof s.customer === "object" && s.customer ? s.customer.phone : "—";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Services</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
          >
            Add Service
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Customer</th>
                  <th className="text-left p-3 font-medium text-slate-700">Phone</th>
                  <th className="text-left p-3 font-medium text-slate-700">Device</th>
                  <th className="text-left p-3 font-medium text-slate-700">Issue</th>
                  <th className="text-left p-3 font-medium text-slate-700">Status</th>
                  <th className="text-right p-3 font-medium text-slate-700">Est.</th>
                  <th className="text-right p-3 font-medium text-slate-700">Final</th>
                  <th className="p-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{serviceCustomerName(s)}</td>
                    <td className="p-3">{serviceCustomerPhone(s)}</td>
                    <td className="p-3">{s.device}</td>
                    <td className="p-3 max-w-xs truncate">{s.issue}</td>
                    <td className="p-3">
                      <select
                        value={s.status}
                        onChange={(e) => updateStatus(s, e.target.value as Status)}
                        className={`text-sm border rounded px-2 py-1 ${s.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right">{s.estimatedCost != null ? `₹${s.estimatedCost}` : "—"}</td>
                    <td className="p-3 text-right">{s.finalCost != null ? `₹${s.finalCost}` : "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-primary-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && services.length === 0 && (
          <p className="p-6 text-slate-500">No services found.</p>
        )}
      </div>

      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[85dvh] overflow-y-auto p-6 safe-area-pb">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Service" : "Add Service"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device</label>
                <input
                  type="text"
                  value={form.device}
                  onChange={(e) => setForm((f) => ({ ...f, device: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue</label>
                <textarea
                  value={form.issue}
                  onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.estimatedCost}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Final Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.finalCost}
                    onChange={(e) => setForm((f) => ({ ...f, finalCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
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
