"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  todaySales: number;
  monthlySales: number;
  totalBillsCount: number;
  pendingServices: number;
  lowStockProducts: number;
}

const statIcons: Record<string, string> = {
  today: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  monthly: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  bills: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  services: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  stock: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Today’s Sales",
      value: stats?.todaySales != null ? `₹${stats.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—",
      href: "/bills",
      icon: statIcons.today,
      bg: "bg-emerald-500",
      light: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Monthly Sales",
      value: stats?.monthlySales != null ? `₹${stats.monthlySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—",
      href: "/bills",
      icon: statIcons.monthly,
      bg: "bg-primary-500",
      light: "bg-primary-50 text-primary-700",
    },
    {
      title: "Total Bills",
      value: stats?.totalBillsCount ?? "—",
      href: "/bills",
      icon: statIcons.bills,
      bg: "bg-violet-500",
      light: "bg-violet-50 text-violet-700",
    },
    {
      title: "Pending Services",
      value: stats?.pendingServices ?? "—",
      href: "/services",
      icon: statIcons.services,
      bg: "bg-amber-500",
      light: "bg-amber-50 text-amber-700",
    },
    {
      title: "Low Stock",
      value: stats?.lowStockProducts ?? "—",
      href: "/products?lowStock=true",
      icon: statIcons.stock,
      bg: "bg-rose-500",
      light: "bg-rose-50 text-rose-700",
    },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-white shadow-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your shop performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group block rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:border-slate-200 hover:shadow-card-hover touch-manipulation"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} text-white`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{card.title}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 group-hover:text-primary-600">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Open POS
        </Link>
        <Link
          href="/bills"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-card transition hover:bg-slate-50"
        >
          View all bills
        </Link>
      </div>
    </div>
  );
}
