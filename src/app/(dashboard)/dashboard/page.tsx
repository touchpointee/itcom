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

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-800 mb-4 md:text-2xl md:mb-6">Dashboard</h1>
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Today Sales",
      value: stats?.todaySales != null ? `₹${stats.todaySales.toFixed(2)}` : "—",
      href: "/bills",
      color: "bg-emerald-500",
    },
    {
      title: "Monthly Sales",
      value: stats?.monthlySales != null ? `₹${stats.monthlySales.toFixed(2)}` : "—",
      href: "/bills",
      color: "bg-blue-500",
    },
    {
      title: "Total Bills",
      value: stats?.totalBillsCount ?? "—",
      href: "/bills",
      color: "bg-violet-500",
    },
    {
      title: "Pending Services",
      value: stats?.pendingServices ?? "—",
      href: "/services",
      color: "bg-amber-500",
    },
    {
      title: "Low Stock Products",
      value: stats?.lowStockProducts ?? "—",
      href: "/products?lowStock=true",
      color: "bg-rose-500",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-4 md:text-2xl md:mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block bg-white rounded-lg border border-slate-200 shadow-sm p-3 sm:p-5 hover:shadow-md transition-shadow touch-manipulation"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.color} opacity-90 mb-2 sm:mb-3`} />
            <h2 className="text-xs sm:text-sm font-medium text-slate-500">{card.title}</h2>
            <p className="text-base sm:text-xl font-semibold text-slate-800 mt-1 break-words">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
