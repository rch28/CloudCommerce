"use client";
import { useState } from "react";
import { Mail, Search } from "lucide-react";
import { customers as allCustomers } from "@/data/mock";

export default function CustomersView() {
  const [search, setSearch] = useState("");
  const filtered = allCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-violet-700/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{c.name}</p>
                <p className="truncate text-xs text-slate-500">{c.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">Orders</p>
                <p className="text-lg font-bold text-white">{c.orders}</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">Spent</p>
                <p className="text-lg font-bold text-violet-400">${c.spent.toLocaleString()}</p>
              </div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
              <Mail size={15} /> Contact
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
