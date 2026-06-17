"use client";
import { useState } from "react";
import { Plus, Search, Pencil } from "lucide-react";
import Badge from "../Badge";
import { products as allProducts } from "@/data/mock";

export default function ProductsView() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const cats = ["All", "Audio", "Wearables"];

  const filtered = allProducts.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                cat === c
                  ? "bg-violet-600 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative sm:hidden">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 hover:opacity-90">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="hidden sm:relative sm:block sm:mb-4 sm:max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition-all hover:-translate-y-1 hover:border-violet-700/50"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-950">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute right-2 top-2">
                <Badge status={p.status} />
              </div>
              <button className="absolute right-2 bottom-2 rounded-lg bg-slate-900/80 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Pencil size={14} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-violet-400">{p.category}</p>
              <h4 className="mt-0.5 truncate font-medium text-white">{p.name}</h4>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-white">${p.price.toFixed(2)}</span>
                <span
                  className={`text-xs font-medium ${
                    p.stock === 0 ? "text-rose-400" : p.stock < 15 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.variants.map((v) => (
                  <span key={v} className="rounded border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <Search size={32} className="mb-2" />
          No products found.
        </div>
      )}
    </div>
  );
}
