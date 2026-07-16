"use client";
import { useState, useEffect, useCallback } from "react";
import { cmsApi } from "@/services/cms.service";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi } from "@/services/settings.service";
import {
  FileText, Plus, Trash2, MoveUp, MoveDown, Eye,
  Layout, Image, Type as TypeIcon, Grid, Tag, Megaphone, MousePointerClick,
  Search, Loader2, AlertCircle, ChevronDown, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import Badge from "../Badge";
import ActionButtons from "@/components/ui/action-buttons";
import DataTable from "@/components/dashboard/data-table";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import HeroBlock from "@/components/cc/cms/blocks/hero-block";
import TextBlock from "@/components/cc/cms/blocks/text-block";
import ImageBlock from "@/components/cc/cms/blocks/image-block";
import ProductGridBlock from "@/components/cc/cms/blocks/product-grid-block";
import CategoryGridBlock from "@/components/cc/cms/blocks/category-grid-block";
import BannerBlock from "@/components/cc/cms/blocks/banner-block";
import CtaBlock from "@/components/cc/cms/blocks/cta-block";

const BLOCK_TYPES = [
  { id: "hero", label: "Hero", icon: Layout },
  { id: "text", label: "Text", icon: TypeIcon },
  { id: "image", label: "Image", icon: Image },
  { id: "product_grid", label: "Product Grid", icon: Grid },
  { id: "category_grid", label: "Category Grid", icon: Tag },
  { id: "banner", label: "Banner", icon: Megaphone },
  { id: "cta", label: "CTA", icon: MousePointerClick },
] as const;

const PAGE_TYPES = ["home", "about", "contact", "landing", "custom"] as const;

interface PageItem {
  id: string; title: string; slug: string; type: string; status: string;
  metaTitle: string | null; metaDescription: string | null;
  isHomePage: boolean; publishedAt: string | null;
  sections: SectionItem[];
  createdAt: string; updatedAt: string;
}

interface SectionItem {
  id: string; pageId: string; type: string; content: Record<string, unknown>;
  styles: Record<string, unknown> | null; sortOrder: number; isVisible: boolean;
}

interface BannerItem {
  id: string; title: string; subtitle: string | null; imageUrl: string | null;
  linkUrl: string | null; linkText: string | null; position: string;
  type: string; bgColor: string | null; textColor: string | null;
  isActive: boolean; startsAt: string | null; endsAt: string | null;
  sortOrder: number; createdAt: string;
}

function BlockEditor({ section, onChange }: { section: SectionItem; onChange: (s: SectionItem) => void }) {
  const updateContent = (content: Record<string, unknown>, styles?: Record<string, unknown>) => {
    onChange({ ...section, content, styles: styles ?? section.styles });
  };

  const commonProps = { content: section.content, styles: section.styles ?? undefined, onChange: updateContent };

  switch (section.type) {
    case "hero": return <HeroBlock {...commonProps} />;
    case "text": return <TextBlock {...commonProps as any} />;
    case "image": return <ImageBlock {...commonProps as any} />;
    case "product_grid": return <ProductGridBlock {...commonProps as any} />;
    case "category_grid": return <CategoryGridBlock {...commonProps as any} />;
    case "banner": return <BannerBlock {...commonProps} />;
    case "cta": return <CtaBlock {...commonProps} />;
    default: return <div className="text-sm text-slate-500">Unknown block type: {section.type}</div>;
  }
}

function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = "Delete", variant = "destructive" }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string;
  onConfirm: () => void; confirmLabel?: string; variant?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <Button
            onClick={() => { onConfirm(); onOpenChange(false); }}
            variant={variant === "destructive" ? "destructive" : "default"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CMSView() {
  const [activeTab, setActiveTab] = useState("pages");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [pageOpen, setPageOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "page" | "banner"; id: string } | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const { session } = useAuth();

  // Page form state
  const [pageForm, setPageForm] = useState({
    title: "", slug: "", type: "custom", status: "draft" as string,
    metaTitle: "", metaDescription: "", isHomePage: false,
  });
  const [pageSections, setPageSections] = useState<SectionItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Banner form state
  const [bannerForm, setBannerForm] = useState({
    title: "", subtitle: "", imageUrl: "", linkUrl: "", linkText: "",
    position: "top", type: "promotional", bgColor: "", textColor: "",
    isActive: true, startsAt: "", endsAt: "", sortOrder: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([
        (async () => {
          try {
            const data = await cmsApi.listPages();
            if (!cancelled) setPages((data as any).items ?? []);
          } catch { if (!cancelled) setError("Failed to load pages"); }
        })(),
        (async () => {
          try {
            const data = await cmsApi.listBanners();
            if (!cancelled) setBanners((data as any).items ?? []);
          } catch { if (!cancelled) setError("Failed to load banners"); }
        })(),
        (async () => {
          try {
            const data = await settingsApi.get();
            if (!cancelled) setStoreSlug((data as any).slug ?? null);
          } catch { /* store slug not critical */ }
        })(),
      ]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchPages = async () => {
    try {
      const data = await cmsApi.listPages();
      setPages((data as any).items ?? []);
    } catch { setError("Failed to load pages"); }
  };

  const fetchBanners = async () => {
    try {
      const data = await cmsApi.listBanners();
      setBanners((data as any).items ?? []);
    } catch { setError("Failed to load banners"); }
  };

  // ── Page CRUD ──────────────────────────────────────────

  const resetPageForm = () => {
    setPageForm({ title: "", slug: "", type: "custom", status: "draft", metaTitle: "", metaDescription: "", isHomePage: false });
    setPageSections([]);
    setEditingPage(null);
  };

  const openNewPage = () => {
    resetPageForm();
    setPageOpen(true);
  };

  const openEditPage = (page: PageItem) => {
    setEditingPage(page);
    setPageForm({
      title: page.title, slug: page.slug, type: page.type, status: page.status,
      metaTitle: page.metaTitle ?? "", metaDescription: page.metaDescription ?? "",
      isHomePage: page.isHomePage,
    });
    setPageSections(page.sections.map((s) => ({ ...s, content: { ...s.content }, styles: s.styles ? { ...s.styles } : null })));
    setPageOpen(true);
  };

  const handleSavePage = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...pageForm,
        metaTitle: pageForm.metaTitle || undefined,
        metaDescription: pageForm.metaDescription || undefined,
        sections: pageSections.map((s, i) => ({
          type: s.type, content: s.content, styles: s.styles ?? undefined,
          sortOrder: i, isVisible: s.isVisible,
        })),
      };

      if (editingPage) {
        await cmsApi.updatePage(editingPage.id, body);
      } else {
        await cmsApi.createPage(body);
      }
      await fetchPages();
      setPageOpen(false);
      resetPageForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      await cmsApi.deletePage(id);
      await fetchPages();
    } catch { setError("Failed to delete page"); }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      await cmsApi.publishPage(id, { publish });
      await fetchPages();
    } catch { setError("Failed to update page status"); }
  };

  // ── Section Management ────────────────────────────────

  const addSection = (type: string) => {
    const defaultContent: Record<string, Record<string, unknown>> = {
      hero: { title: "", subtitle: "", ctaText: "", ctaLink: "", alignment: "left" },
      text: { body: "" },
      image: { src: "", alt: "", caption: "" },
      product_grid: { title: "Featured Products", productIds: "", categoryId: "", limit: 8 },
      category_grid: { title: "Shop by Category", categoryIds: "", limit: 6 },
      banner: { message: "", linkUrl: "", linkText: "" },
      cta: { title: "", description: "", buttonText: "", buttonLink: "", alignment: "center" },
    };
    const newSection: SectionItem = {
      id: `new-${Date.now()}`,
      pageId: editingPage?.id ?? "",
      type,
      content: defaultContent[type] || {},
      styles: type === "banner" ? { bgColor: "#7C3AED", textColor: "#FFFFFF" } : null,
      sortOrder: pageSections.length,
      isVisible: true,
    };
    setPageSections([...pageSections, newSection]);
  };

  const updateSection = (index: number, section: SectionItem) => {
    const updated = [...pageSections];
    updated[index] = section;
    setPageSections(updated);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pageSections.length) return;
    const updated = [...pageSections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPageSections(updated);
  };

  const removeSection = (index: number) => {
    setPageSections(pageSections.filter((_, i) => i !== index));
  };

  // ── Banner CRUD ───────────────────────────────────────

  const resetBannerForm = () => {
    setBannerForm({
      title: "", subtitle: "", imageUrl: "", linkUrl: "", linkText: "",
      position: "top", type: "promotional", bgColor: "", textColor: "",
      isActive: true, startsAt: "", endsAt: "", sortOrder: 0,
    });
    setEditingBanner(null);
  };

  const openNewBanner = () => {
    resetBannerForm();
    setBannerOpen(true);
  };

  const openEditBanner = (banner: BannerItem) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title, subtitle: banner.subtitle ?? "", imageUrl: banner.imageUrl ?? "",
      linkUrl: banner.linkUrl ?? "", linkText: banner.linkText ?? "",
      position: banner.position, type: banner.type,
      bgColor: banner.bgColor ?? "", textColor: banner.textColor ?? "",
      isActive: banner.isActive, startsAt: banner.startsAt ?? "", endsAt: banner.endsAt ?? "",
      sortOrder: banner.sortOrder,
    });
    setBannerOpen(true);
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle || undefined,
        imageUrl: bannerForm.imageUrl || undefined,
        linkUrl: bannerForm.linkUrl || undefined,
        linkText: bannerForm.linkText || undefined,
        position: bannerForm.position,
        type: bannerForm.type,
        bgColor: bannerForm.bgColor || undefined,
        textColor: bannerForm.textColor || undefined,
        isActive: bannerForm.isActive,
        sortOrder: bannerForm.sortOrder,
      };
      if (bannerForm.startsAt) body.startsAt = new Date(bannerForm.startsAt).toISOString();
      if (bannerForm.endsAt) body.endsAt = new Date(bannerForm.endsAt).toISOString();

      if (editingBanner) {
        await cmsApi.updateBanner(editingBanner.id, body);
      } else {
        await cmsApi.createBanner(body);
      }
      await fetchBanners();
      setBannerOpen(false);
      resetBannerForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await cmsApi.deleteBanner(id);
      await fetchBanners();
    } catch { setError("Failed to delete banner"); }
  };

  // ── Preview ───────────────────────────────────────────
  const openPreview = (slug: string) => {
    const tenant = storeSlug || session?.subdomain || "t-1";
    window.open(`/store/${tenant}/pages/${slug}?preview=true`, "_blank");
  };

  // ── Loading / Error ────────────────────────────────────
  if (loading) return <LoadingSkeleton variant="tabbed-page" />;

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage pages, banners, and content blocks.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText size={15} /> Pages
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Megaphone size={15} /> Banners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <DataTable
            columns={[
              {
                key: "title",
                label: "Title",
                sortable: true,
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return (
                    <div>
                      <p className="font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-slate-500">/{p.slug}</p>
                    </div>
                  );
                },
              },
              {
                key: "type",
                label: "Type",
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                      {p.type}
                    </span>
                  );
                },
              },
              {
                key: "status",
                label: "Status",
                sortable: true,
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return <Badge status={p.status} />;
                },
              },
              {
                key: "sections",
                label: "Sections",
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return <span className="text-sm text-muted-foreground">{p.sections?.length ?? 0}</span>;
                },
              },
              {
                key: "updatedAt",
                label: "Updated",
                sortable: true,
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return <span className="text-sm text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</span>;
                },
              },
              {
                key: "actions",
                label: "",
                render: (item: Record<string, unknown>) => {
                  const p = item as unknown as PageItem;
                  return (
                    <ActionButtons
                      actions={[
                        { type: "preview", tooltip: "Preview page", onClick: () => openPreview(p.slug) },
                        { type: p.status === "published" ? "unpublish" : "publish", tooltip: p.status === "published" ? "Unpublish page" : "Publish page", onClick: () => handlePublish(p.id, p.status !== "published") },
                        { type: "edit", tooltip: "Edit page", onClick: () => openEditPage(p) },
                        { type: "delete", tooltip: "Delete page", onClick: () => setConfirmDelete({ type: "page", id: p.id }) },
                      ]}
                    />
                  );
                },
              },
            ]}
            data={pages as unknown as Record<string, unknown>[]}
            searchable
            searchKeys={["title", "slug"]}
            emptyTitle="No pages yet"
            emptyDescription="Create your first page to get started with the CMS."
            loading={false}
            actions={
              <Button onClick={openNewPage}>
                <Plus size={16} /> Add Page
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="banners">
          <DataTable
            columns={[
              {
                key: "title",
                label: "Title",
                sortable: true,
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: b.bgColor || "#7C3AED" }}
                      >
                        <Megaphone size={15} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{b.title}</p>
                        {b.subtitle && <p className="text-xs text-slate-500">{b.subtitle}</p>}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "position",
                label: "Position",
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                      {b.position}
                    </span>
                  );
                },
              },
              {
                key: "type",
                label: "Type",
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return <span className="text-sm text-muted-foreground capitalize">{b.type}</span>;
                },
              },
              {
                key: "isActive",
                label: "Status",
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return <Badge status={b.isActive ? "active" : "draft"} />;
                },
              },
              {
                key: "sortOrder",
                label: "Order",
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return <span className="text-sm text-muted-foreground">{b.sortOrder}</span>;
                },
              },
              {
                key: "actions",
                label: "",
                render: (item: Record<string, unknown>) => {
                  const b = item as unknown as BannerItem;
                  return (
                    <ActionButtons
                      actions={[
                        { type: "edit", tooltip: "Edit banner", onClick: () => openEditBanner(b) },
                        { type: "delete", tooltip: "Delete banner", onClick: () => setConfirmDelete({ type: "banner", id: b.id }) },
                      ]}
                    />
                  );
                },
              },
            ]}
            data={banners as unknown as Record<string, unknown>[]}
            searchable
            searchKeys={["title", "subtitle"]}
            emptyTitle="No banners yet"
            emptyDescription="Create your first banner to promote your products."
            loading={false}
            actions={
              <Button onClick={openNewBanner}>
                <Plus size={16} /> Add Banner
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      {/* ── Page Dialog ──────────────────────────────────── */}
      <Dialog open={pageOpen} onOpenChange={(v) => { if (!v) { setPageOpen(false); resetPageForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Create Page"}</DialogTitle>
            <DialogDescription>
              Configure your page settings and add content sections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Metadata */}
            <div className="rounded-xl border border-border bg-muted/50 p-5">
              <h4 className="mb-4 text-sm font-semibold text-foreground">Page Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Title</Label>
                  <Input
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value, slug: editingPage ? pageForm.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })}
                    placeholder="About Us"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Slug</Label>
                  <Input
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    placeholder="about-us"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Type</Label>
                  <Select value={pageForm.type} onValueChange={(v) => setPageForm({ ...pageForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Status</Label>
                  <Select value={pageForm.status} onValueChange={(v) => setPageForm({ ...pageForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Meta Title</Label>
                  <Input
                    value={pageForm.metaTitle}
                    onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                    placeholder="SEO title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label variant="muted" size="sm">Meta Description</Label>
                  <Input
                    value={pageForm.metaDescription}
                    onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                    placeholder="SEO description"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Switch
                  checked={pageForm.isHomePage}
                  onCheckedChange={(v) => setPageForm({ ...pageForm, isHomePage: v })}
                />
                <Label variant="muted" size="sm">Set as Home Page</Label>
              </div>
            </div>

            {/* Page Builder */}
            <div className="rounded-xl border border-border bg-muted/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Sections ({pageSections.length})</h4>
              </div>

              {pageSections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Layout size={32} className="mx-auto text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500">No sections yet. Add your first content block below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageSections.map((section, index) => (
                    <div key={section.id} className="rounded-xl border border-border/50 bg-muted/30">
                      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                            {section.type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-slate-500">#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveSection(index, "up")}
                            disabled={index === 0}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-foreground disabled:opacity-30"
                          >
                            <MoveUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSection(index, "down")}
                            disabled={index === pageSections.length - 1}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-foreground disabled:opacity-30"
                          >
                            <MoveDown size={14} />
                          </button>
                          <button
                            onClick={() => setPageSections(pageSections.map((s, i) => i === index ? { ...s, isVisible: !s.isVisible } : s))}
                            className={`rounded p-1 transition-colors hover:bg-slate-700 ${section.isVisible ? "text-emerald-400" : "text-slate-600"}`}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => removeSection(index)}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <BlockEditor section={section} onChange={(s) => updateSection(index, s)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Section */}
              <div className="mt-4">
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) { addSection(e.target.value); e.target.value = ""; } }}
                    className="w-full rounded-lg border border-dashed border-border bg-transparent px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-slate-600 hover:text-foreground appearance-none cursor-pointer"
                  >
                    <option value="" disabled>+ Add Section</option>
                    {BLOCK_TYPES.map((bt) => (
                      <option key={bt.id} value={bt.id}>{bt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { setPageOpen(false); resetPageForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSavePage} disabled={saving || !pageForm.title || !pageForm.slug}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingPage ? "Update Page" : "Create Page"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Banner Dialog ────────────────────────────────── */}
      <Dialog open={bannerOpen} onOpenChange={(v) => { if (!v) { setBannerOpen(false); resetBannerForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
            <DialogDescription>
              Configure your promotional banner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Title</Label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                placeholder="Summer Sale"
              />
            </div>
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Subtitle</Label>
              <Input
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                placeholder="Up to 50% off"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Position</Label>
                <Select value={bannerForm.position} onValueChange={(v) => setBannerForm({ ...bannerForm, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Type</Label>
                <Select value={bannerForm.type} onValueChange={(v) => setBannerForm({ ...bannerForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="informational">Informational</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Image URL</Label>
              <Input
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Link URL</Label>
                <Input
                  value={bannerForm.linkUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                  placeholder="/sale"
                />
              </div>
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Link Text</Label>
                <Input
                  value={bannerForm.linkText}
                  onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Background Color</Label>
                <Input
                  value={bannerForm.bgColor}
                  onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                  placeholder="#7C3AED"
                />
              </div>
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Text Color</Label>
                <Input
                  value={bannerForm.textColor}
                  onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={bannerForm.startsAt}
                  onChange={(e) => setBannerForm({ ...bannerForm, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label variant="muted" size="sm">End Date</Label>
                <Input
                  type="datetime-local"
                  value={bannerForm.endsAt}
                  onChange={(e) => setBannerForm({ ...bannerForm, endsAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label variant="muted" size="sm">Sort Order</Label>
              <Input
                type="number"
                value={bannerForm.sortOrder}
                onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={bannerForm.isActive}
                onCheckedChange={(v) => setBannerForm({ ...bannerForm, isActive: v })}
              />
              <Label variant="muted" size="sm">Active</Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { setBannerOpen(false); resetBannerForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveBanner} disabled={saving || !bannerForm.title}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingBanner ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete ────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.type === "page" ? "Page" : "Banner"}`}
        description={`Are you sure? This action cannot be undone.`}
        onConfirm={() => {
          if (confirmDelete?.type === "page") handleDeletePage(confirmDelete.id);
          else if (confirmDelete?.type === "banner") handleDeleteBanner(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
