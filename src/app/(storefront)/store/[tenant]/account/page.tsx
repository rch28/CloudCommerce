"use client";
import React from "react";
import { User, Mail, Phone } from "lucide-react";

export default function AccountProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your account information.</p>
      <div className="space-y-4">
        {[
          { icon: User, label: "Name", value: "Guest User" },
          { icon: Mail, label: "Email", value: "guest@example.com" },
          { icon: Phone, label: "Phone", value: "Not set" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-[#09090B] px-4 py-3">
            <item.icon size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm text-[#F8FAFC]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
