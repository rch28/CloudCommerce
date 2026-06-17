"use client";
import React from "react";
import { MapPin, Plus } from "lucide-react";

export default function AccountAddressesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);

  const demoAddresses = [
    { id: "1", label: "Home", line1: "123 Main St", city: "San Francisco", state: "CA", zip: "94105", default: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Addresses</h2>
        <button className="flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8B5CF6] transition-colors">
          <Plus size={14} /> Add Address
        </button>
      </div>
      {demoAddresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <MapPin size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved addresses</p>
        </div>
      ) : (
        demoAddresses.map((addr) => (
          <div key={addr.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#F8FAFC]">{addr.label}</span>
                  {addr.default && <span className="rounded-full bg-[#7C3AED]/20 px-2 py-0.5 text-[10px] font-medium text-[#7C3AED]">Default</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{addr.line1}</p>
                <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
