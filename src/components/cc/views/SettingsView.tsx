"use client";
import { useState, useEffect } from "react";
import { settingsApi } from "@/services/settings.service";
import {
  Store, Palette, Mail, MapPin, Search, Globe, Users, Shield,
  Loader2, Check, X, Plus, Copy, EyeOff, AlertTriangle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const TABS = [
  { id: "store", label: "Store", icon: Store },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "address", label: "Address", icon: MapPin },
  { id: "seo", label: "SEO", icon: Search },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

const PRESET_COLORS = [
  "#7C3AED", "#06B6D4", "#22C55E", "#F59E0B",
  "#EC4899", "#3B82F6", "#EF4444", "#14B8A6",
];

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={18} className="text-primary" />
        <h3 className="font-semibold text-[#F8FAFC]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label variant="muted" size="sm">{label}</Label>
      {children}
    </div>
  );
}

interface StaffMember {
  id: string;
  email: string;
  role: string;
  status: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  fullKey?: string;
  scopes: string[];
  createdAt: string;
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [store, setStore] = useState({ name: "", slug: "", logoUrl: "", description: "" });
  const [branding, setBranding] = useState({ primaryColor: "#7C3AED", secondaryColor: "#06B6D4" });
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState({ country: "", state: "", city: "", postalCode: "" });
  const [seo, setSeo] = useState({ metaTitle: "", metaDescription: "" });
  const [domains, setDomains] = useState({ subdomain: "", customDomain: "" });

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviting, setInviting] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsData, staffData, keysData] = await Promise.all([
        settingsApi.get(),
        settingsApi.listStaff(),
        settingsApi.listApiKeys(),
      ]);
      if (settingsData.store) setStore(settingsData.store);
      if (settingsData.branding) setBranding(settingsData.branding);
      if (settingsData.contact) setContact(settingsData.contact);
      if (settingsData.address) setAddress(settingsData.address);
      if (settingsData.seo) setSeo(settingsData.seo);
      if (settingsData.domains) setDomains(settingsData.domains);
      setStaff(Array.isArray(staffData) ? staffData : (staffData as any).staff || []);
      setApiKeys(Array.isArray(keysData) ? keysData : (keysData as any).keys || []);
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSection(sectionName: string, data: any) {
    setSaving(sectionName);
    setError(null);
    try {
      await settingsApi.update({ [sectionName]: data });
      setSavedSection(sectionName);
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function inviteStaff() {
    if (!inviteEmail) return;
    setInviting(true);
    setError(null);
    try {
      const data = await settingsApi.inviteStaff({ email: inviteEmail, role: inviteRole });
      setStaff((prev) => [...prev, data]);
      setInviteEmail("");
      setInviteRole("staff");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function removeStaff(id: string) {
    setError(null);
    try {
      await settingsApi.deleteStaff(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateStaffRole(id: string, role: string) {
    setError(null);
    try {
      await settingsApi.updateStaff(id, { role });
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createApiKey() {
    if (!keyName) return;
    setCreatingKey(true);
    setError(null);
    try {
      const scopes = keyScopes.split(",").map((s) => s.trim()).filter(Boolean);
      const data = await settingsApi.createApiKey({ name: keyName, scopes });
      setNewKey(data.fullKey || data.key || "");
      setApiKeys((prev) => [...prev, data]);
      setKeyName("");
      setKeyScopes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id: string) {
    setError(null);
    try {
      await settingsApi.deleteApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function renderTabButton(tab: typeof TABS[number]) {
    const Icon = tab.icon;
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeTab === tab.id
            ? "bg-[#7C3AED] text-white"
            : "text-muted-foreground hover:text-[#F8FAFC]"
        }`}
      >
        <Icon size={15} />
        {tab.label}
      </button>
    );
  }

  function renderSaveButton(sectionName: string) {
    const isSaving = saving === sectionName;
    const isSaved = savedSection === sectionName;
    return (
      <Button
        type="submit"
        disabled={isSaving}
        className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
      >
        {isSaving ? (
          <><Loader2 size={15} className="mr-1 animate-spin" /> Saving...</>
        ) : isSaved ? (
          <><Check size={15} className="mr-1" /> Saved!</>
        ) : (
          "Save"
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <p className="flex-1 text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
        {TABS.map(renderTabButton)}
      </div>

      {activeTab === "store" && (
        <Section icon={Store} title="Store">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("store", store); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Store Name">
                <Input
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <Input value={store.slug} disabled />
              </Field>
              <Field label="Logo URL">
                <Input
                  value={store.logoUrl}
                  onChange={(e) => setStore({ ...store, logoUrl: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={store.description}
                onChange={(e) => setStore({ ...store, description: e.target.value })}
              />
            </Field>
            <div className="flex justify-end">
              {renderSaveButton("store")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "branding" && (
        <Section icon={Palette} title="Branding">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("branding", branding); }}
            className="space-y-4"
          >
            <Field label="Primary Color">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBranding({ ...branding, primaryColor: c })}
                    className={`h-8 w-8 rounded-md ring-2 ring-offset-2 ring-offset-background transition-all ${
                      branding.primaryColor === c ? "ring-[#F8FAFC] scale-110" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent"
                />
              </div>
            </Field>
            <Field label="Secondary Color">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBranding({ ...branding, secondaryColor: c })}
                    className={`h-8 w-8 rounded-md ring-2 ring-offset-2 ring-offset-background transition-all ${
                      branding.secondaryColor === c ? "ring-[#F8FAFC] scale-110" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent"
                />
              </div>
            </Field>
            <Field label="Preview">
              <div
                className="flex h-20 items-center justify-center rounded-lg"
                style={{ backgroundColor: branding.primaryColor, color: branding.secondaryColor }}
              >
                <span className="text-sm font-semibold">CloudCommerce Store</span>
              </div>
            </Field>
            <div className="flex justify-end">
              {renderSaveButton("branding")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "contact" && (
        <Section icon={Mail} title="Contact">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("contact", contact); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              {renderSaveButton("contact")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "address" && (
        <Section icon={MapPin} title="Address">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("address", address); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Country">
                <Input
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                />
              </Field>
              <Field label="State">
                <Input
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              {renderSaveButton("address")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "seo" && (
        <Section icon={Search} title="SEO">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("seo", seo); }}
            className="space-y-4"
          >
            <Field label="Meta Title">
              <div className="relative">
                <Input
                  maxLength={70}
                  value={seo.metaTitle}
                  onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {seo.metaTitle.length}/70
                </span>
              </div>
            </Field>
            <Field label="Meta Description">
              <div className="relative">
                <Textarea
                  maxLength={160}
                  value={seo.metaDescription}
                  onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {seo.metaDescription.length}/160
                </span>
              </div>
            </Field>
            <Field label="Search Result Preview">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="truncate text-xs text-emerald-400">
                  {origin ? `${origin}/${domains.subdomain || "store"}` : `${domains.subdomain || "store"}.cloudcommerce.com`}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-primary">
                  {seo.metaTitle || "Store Title"} - CloudCommerce
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {seo.metaDescription || "Your store description will appear here in search results."}
                </p>
              </div>
            </Field>
            <div className="flex justify-end">
              {renderSaveButton("seo")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "domains" && (
        <Section icon={Globe} title="Domains">
          <form
            onSubmit={(e) => { e.preventDefault(); saveSection("domains", domains); }}
            className="space-y-4"
          >
            <Field label="Subdomain">
              <div className="flex overflow-hidden rounded-md border border-border">
                <Input
                  value={domains.subdomain}
                  onChange={(e) => setDomains({ ...domains, subdomain: e.target.value })}
                  className="rounded-none border-0"
                />
                <span className="flex items-center border-l border-border bg-muted px-3 text-sm text-muted-foreground">
                  .cloudcommerce.com
                </span>
              </div>
              {origin && domains.subdomain && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview: https://{domains.subdomain}.cloudcommerce.com
                </p>
              )}
            </Field>
            <Field label="Custom Domain">
              <Input
                placeholder="shop.yourdomain.com"
                value={domains.customDomain}
                onChange={(e) => setDomains({ ...domains, customDomain: e.target.value })}
              />
            </Field>
            <div className="flex justify-end">
              {renderSaveButton("domains")}
            </div>
          </form>
        </Section>
      )}

      {activeTab === "users" && (
        <Section icon={Users} title="Users (Staff)">
          <div className="mb-6 rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-sm font-medium text-[#F8FAFC]">Invite Staff Member</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <Label variant="muted" size="xs">Email</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-32">
                <Label variant="muted" size="xs">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={inviteStaff}
                disabled={!inviteEmail || inviting}
                className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
              >
                {inviting ? (
                  <><Loader2 size={15} className="mr-1 animate-spin" /> Inviting...</>
                ) : (
                  <><Plus size={15} className="mr-1" /> Invite</>
                )}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No staff members yet
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-[#F8FAFC]">{m.email}</TableCell>
                    <TableCell>
                      <Select
                        value={m.role}
                        onValueChange={(v) => updateStaffRole(m.id, v)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : m.status === "invited"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStaff(m.id)}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Section>
      )}

      {activeTab === "security" && (
        <Section icon={Shield} title="Security">
          <div className="mb-6">
            {newKey && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">API Key Created</p>
                    <p className="mt-1 break-all font-mono text-sm text-[#F8FAFC]">{newKey}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Make sure to copy this key now. You won&apos;t be able to see it again.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => navigator.clipboard.writeText(newKey)}
                    >
                      <Copy size={14} className="mr-1" /> Copy
                    </Button>
                  </div>
                  <button
                    onClick={() => setNewKey(null)}
                    className="text-muted-foreground hover:text-[#F8FAFC]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="mb-3 text-sm font-medium text-[#F8FAFC]">Create API Key</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <Label variant="muted" size="xs">Key Name</Label>
                  <Input
                    placeholder="e.g. Production"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-[2]">
                  <Label variant="muted" size="xs">Scopes (comma-separated)</Label>
                  <Input
                    placeholder="products:read, orders:write, customers:read"
                    value={keyScopes}
                    onChange={(e) => setKeyScopes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  onClick={createApiKey}
                  disabled={!keyName || creatingKey}
                  className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
                >
                  {creatingKey ? (
                    <><Loader2 size={15} className="mr-1 animate-spin" /> Generating...</>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No API keys yet
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((k) => {
                  const isRevealed = revealedKeys.has(k.id);
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="text-[#F8FAFC]">{k.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {isRevealed ? k.fullKey || k.prefix : k.prefix}
                        </code>
                        {k.fullKey && (
                          <button
                            onClick={() => {
                              const next = new Set(revealedKeys);
                              if (isRevealed) next.delete(k.id);
                              else next.add(k.id);
                              setRevealedKeys(next);
                            }}
                            className="ml-2 text-muted-foreground hover:text-[#F8FAFC]"
                          >
                            <EyeOff size={13} />
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeKey(k.id)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Section>
      )}
    </div>
  );
}
