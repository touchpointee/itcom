"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white touch-manipulation"
    >
      Logout
    </button>
  );
}

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/bulk-upload", label: "Bulk upload" },
  { href: "/categories", label: "Categories" },
  { href: "/distributors", label: "Distributors" },
  { href: "/customers", label: "Customers" },
  { href: "/pos", label: "POS" },
  { href: "/bills", label: "Bills" },
  { href: "/services", label: "Services" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - fixed top left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white shadow-lg md:hidden touch-manipulation"
        aria-label="Open menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay when sidebar open on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - drawer on mobile, static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-800 text-white shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:w-56 md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-[3.5rem] items-center justify-between border-b border-slate-700 px-4 md:justify-start">
          <Link
            href="/dashboard"
            className="font-semibold text-lg"
            onClick={() => setOpen(false)}
          >
            Mobile Shop POS
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white md:hidden touch-manipulation"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                pathname === href
                  ? "bg-primary-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-2">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
