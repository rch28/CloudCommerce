"use client";
import { useEffect, useState } from "react";
import { Radio, AlertTriangle, Minus, Plus } from "lucide-react";
import { products as initial } from "@/data/mock";

export default function InventoryView() {
  const [stock, setStock] = useState(() =>
    Object.fromEntries(initial.map((p) => [p.id, p.stock])),
  );
  const [pulse, setPulse] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const p = initial[Math.floor(Math.random() * initial.length)];
      const delta = Math.random() > 0.5 ? -1 : 1;
      setStock((s) => ({ ...s, [p.id]: Math.max(0, (s[p.id] || 0) + delta) }));
      setPulse(p.id);
      setTimeout(() => setPulse(null), 1000);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const adjust = (id: string, d: number) =>
    setStock((s) => ({ ...s, [id]: Math.max(0, (s[id] || 0) + d) }));

  const lowStock = initial.filter((p) => (stock[p.id] || 0) < 15);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <Radio size={15} className="animate-pulse" /> Real-time sync active
        </span>
        {lowStock.length > 0 && (
          <span className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400">
            <AlertTriangle size={15} /> {lowStock.length} low-stock alerts
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Sold</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {initial.map((p) => {
                const qty = stock[p.id] || 0;
                const flash = pulse === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${flash ? "bg-violet-500/10" : "hover:bg-slate-800/40"}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <span className="font-medium text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{p.id}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {p.sold.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-semibold ${
                          qty === 0
                            ? "text-rose-400"
                            : qty < 15
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {qty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => adjust(p.id, -1)}
                          className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() => adjust(p.id, 1)}
                          className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
