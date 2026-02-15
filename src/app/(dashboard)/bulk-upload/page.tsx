"use client";

import Link from "next/link";
import { useState } from "react";

interface ImportResult {
  imported: number;
  errors?: string[];
  created?: { _id: string; name: string }[];
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setResult(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/excel/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }
      setResult({ imported: data.imported, errors: data.errors, created: data.created });
      setFile(null);
      if (typeof document !== "undefined" && document.querySelector<HTMLInputElement>('input[type="file"]')) {
        (document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement).value = "";
      }
    } finally {
      setUploading(false);
    }
  }

  function clearResult() {
    setResult(null);
    setError("");
  }

  return (
    <div className="flex flex-col min-h-0">
      <h1 className="text-xl font-semibold text-slate-800 mb-3 md:text-2xl md:mb-4">
        Bulk upload
      </h1>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 space-y-6">
          <p className="text-slate-600 text-sm">
            Upload an Excel file (.xlsx) to add many products at once. Use the template below to get the correct columns.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/excel/template"
              download="products_template.xlsx"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download template
            </a>
            <Link
              href="/api/excel/export"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export current products
            </Link>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Required columns</div>
            <code className="text-sm text-slate-700 break-all">
              name, categoryId, distributorId, purchasePrice, sellingPrice, stock, imei
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Use exact IDs from Categories and Distributors pages. <em>imei</em> is optional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bulk-file" className="block text-sm font-medium text-slate-700 mb-1">
                Choose file
              </label>
              <input
                id="bulk-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  clearResult();
                }}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {result && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <p className="text-sm font-medium text-slate-800">
                  Imported {result.imported} product(s).
                  {result.errors?.length ? ` ${result.errors.length} row(s) had errors.` : ""}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="text-xs text-amber-700 max-h-32 overflow-y-auto list-disc list-inside">
                    {result.errors.slice(0, 15).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 15 && (
                      <li>...and {result.errors.length - 15} more</li>
                    )}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={clearResult}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || !file}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <Link
                href="/products"
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View products
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
