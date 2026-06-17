"use client";
import { useState } from "react";
import { Globe, Palette, CreditCard, Check } from "lucide-react";

export default function SettingsView() {
  const [color, setColor] = useState("#7C3AED");
  const colors = ["#7C3AED", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6"];
  const [saved, setSaved] = useState(false);

  const plans = [
    { name: "Starter", price: 29, feats: ["100 products", "Basic analytics", "Email support"] },
    { name: "Growth", price: 79, feats: ["1,000 products", "Real-time sync", "Custom domain"], current: false },
    { name: "Scale", price: 199, feats: ["Unlimited products", "Priority support", "API access"], current: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Palette size={18} className="text-violet-400" />
          <h3 className="font-semibold">Branding</h3>
        </div>
        <label className="text-sm text-slate-400">Store name</label>
        <input defaultValue="SoundWave Co." className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-600" />
        <p className="mt-4 text-sm text-slate-400">Accent color</p>
        <div className="mt-2 flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-lg ring-2 ring-offset-2 ring-offset-slate-900 ${color === c ? "ring-white" : "ring-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500); }}
          className="mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: color }}
        >
          {saved ? <><Check size={16} /> Saved</> : "Save changes"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Globe size={18} className="text-violet-400" />
          <h3 className="font-semibold">Domains</h3>
        </div>
        <label className="text-sm text-slate-400">Subdomain</label>
        <div className="mt-1.5 flex overflow-hidden rounded-lg border border-slate-800">
          <input defaultValue="soundwave" className="flex-1 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none" />
          <span className="bg-slate-800 px-3 py-2.5 text-sm text-slate-400">.cloudcommerce.com</span>
        </div>
        <label className="mt-4 block text-sm text-slate-400">Custom domain</label>
        <input placeholder="shop.yourdomain.com" className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400"><Check size={13} /> SSL active · DNS verified</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
        <div className="mb-4 flex items-center gap-2 text-white">
          <CreditCard size={18} className="text-violet-400" />
          <h3 className="font-semibold">Subscription &amp; Billing</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-5 ${p.current ? "border-violet-600 bg-violet-900/20" : "border-slate-800"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{p.name}</p>
                {p.current && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">CURRENT</span>}
              </div>
              <p className="mt-2 text-2xl font-bold text-white">${p.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
              <ul className="mt-3 space-y-1.5">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300"><Check size={14} className="text-violet-400" /> {f}</li>
                ))}
              </ul>
              <button className={`mt-4 w-full rounded-lg py-2 text-sm font-medium ${p.current ? "border border-slate-700 text-slate-400" : "bg-violet-600 text-white hover:bg-violet-500"}`}>
                {p.current ? "Manage" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
