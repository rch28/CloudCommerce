"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import { productSchema } from "@/lib/schemas";

type FormValues = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  status: "draft" | "active" | "archived";
  categoryId: string;
  images: { url: string; alt: string; sortOrder: number }[];
  variants: {
    sku: string;
    price: number;
    comparePrice: number | null;
    costPrice: number | null;
    quantity: number;
    isDefault: boolean;
    status: string;
  }[];
};

interface ProductData {
  id: string; name: string; slug: string; description: string | null;
  shortDescription: string | null; status: string;
  seoTitle: string | null; seoDescription: string | null;
  categoryId: string | null;
  images: { url: string; alt: string | null; sortOrder: number }[];
  variants: {
    id: string; sku: string; price: number; comparePrice: number | null;
    costPrice: number | null; quantity: number; isDefault: boolean; status: string;
  }[];
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductData;
  categories: { id: string; name: string }[];
  onSave: (data: any) => Promise<void>;
}

export default function ProductForm({ open, onOpenChange, product, categories, onSave }: ProductFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: "", slug: "", description: "", shortDescription: "",
      seoTitle: "", seoDescription: "", status: "draft", categoryId: "",
      images: [],
      variants: [{ sku: "", price: 0, comparePrice: null, costPrice: null, quantity: 0, isDefault: true, status: "active" }],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control: form.control, name: "images" });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control: form.control, name: "variants" });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        shortDescription: product.shortDescription ?? "",
        seoTitle: product.seoTitle ?? "",
        seoDescription: product.seoDescription ?? "",
        status: product.status as FormValues["status"],
        categoryId: product.categoryId ?? "",
        images: product.images.map((img) => ({ url: img.url, alt: img.alt ?? "", sortOrder: img.sortOrder })),
        variants: product.variants.map((v) => ({
          sku: v.sku, price: v.price, comparePrice: v.comparePrice, costPrice: v.costPrice,
          quantity: v.quantity, isDefault: v.isDefault, status: v.status,
        })),
      });
    } else {
      form.reset({
        name: "", slug: "", description: "", shortDescription: "",
        seoTitle: "", seoDescription: "", status: "draft", categoryId: "",
        images: [],
        variants: [{ sku: "", price: 0, comparePrice: null, costPrice: null, quantity: 0, isDefault: true, status: "active" }],
      });
    }
  }, [product, open, form]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function generateSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.getValues();
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.slug.trim()) {
      const generated = generateSlug(data.name);
      form.setValue("slug", generated);
      data.slug = generated;
    }
    if (data.variants.length === 0) newErrors.variants = "At least one variant is required";

    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!newErrors[key]) newErrors[key] = issue.message;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const activeCategories = categories.filter((c) => c.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-border bg-card text-[#F8FAFC]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {product ? "Update product details, pricing, and SEO" : "Create a new product with pricing, variants, and SEO"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                <Input id="name" className="border-border bg-background text-[#F8FAFC]" {...form.register("name", { onChange: (e) => { if (!product) { const slug = generateSlug(e.target.value); form.setValue("slug", slug); } } })} />
                {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                <Input id="slug" className="border-border bg-background text-[#F8FAFC] font-mono text-xs" {...form.register("slug")} />
                {errors.slug && <p className="text-xs text-rose-400">{errors.slug}</p>}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" className="border-border bg-background text-[#F8FAFC]" placeholder="Brief summary for listings" {...form.register("shortDescription")} />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <textarea id="description" rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]" {...form.register("description")} />
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Media / Images</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => appendImage({ url: "", alt: "", sortOrder: imageFields.length })} className="border-border text-muted-foreground hover:text-[#F8FAFC]">
                <Plus size={14} className="mr-1" /> Add Image
              </Button>
            </div>
            {imageFields.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
                <div>
                  <ImageIcon size={24} className="mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">No images added yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#1E293B]">
                      {form.watch(`images.${index}.url`) ? (
                        <img src={form.watch(`images.${index}.url`)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input className="h-8 border-border bg-card text-xs text-[#F8FAFC]" placeholder="Image URL" {...form.register(`images.${index}.url`)} />
                      <Input className="h-8 border-border bg-card text-xs text-[#F8FAFC]" placeholder="Alt text" {...form.register(`images.${index}.alt`)} />
                    </div>
                    <button type="button" onClick={() => removeImage(index)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-rose-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price ($) <span className="text-red-500">*</span></Label>
                <Controller control={form.control} name="variants.0.price" render={({ field: f }) => (
                  <Input type="number" step="0.01" className="border-border bg-background text-[#F8FAFC]" value={f.value || ""} onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)} />
                )} />
                {errors["variants.0.price"] && <p className="text-xs text-rose-400">{errors["variants.0.price"]}</p>}
              </div>
              <div className="space-y-2">
                <Label>Compare Price ($)</Label>
                <Controller control={form.control} name="variants.0.comparePrice" render={({ field: f }) => (
                  <Input type="number" step="0.01" className="border-border bg-background text-[#F8FAFC]" value={f.value ?? ""} onChange={(e) => f.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                )} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price ($)</Label>
                <Controller control={form.control} name="variants.0.costPrice" render={({ field: f }) => (
                  <Input type="number" step="0.01" className="border-border bg-background text-[#F8FAFC]" value={f.value ?? ""} onChange={(e) => f.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                )} />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Organization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <select id="categoryId" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]" {...form.register("categoryId")}>
                  <option value="">No category</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]" {...form.register("status")}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">SEO</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input id="seoTitle" className="border-border bg-background text-[#F8FAFC]" placeholder="Optional — overrides title in search results" {...form.register("seoTitle")} />
                <p className="text-[10px] text-muted-foreground">{form.watch("seoTitle")?.length ?? 0}/70 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <textarea id="seoDescription" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]" {...form.register("seoDescription")} />
                <p className="text-[10px] text-muted-foreground">{form.watch("seoDescription")?.length ?? 0}/160 characters</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Variants</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ sku: "", price: 0, comparePrice: null, costPrice: null, quantity: 0, isDefault: variantFields.length === 0, status: "active" })} className="border-border text-muted-foreground hover:text-[#F8FAFC]">
                <Plus size={14} className="mr-1" /> Add Variant
              </Button>
            </div>
            {errors.variants && <p className="mb-2 text-xs text-rose-400">{errors.variants}</p>}
            <div className="space-y-3">
              {variantFields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Variant {index + 1}</span>
                      {form.watch(`variants.${index}.isDefault`) && (
                        <span className="rounded bg-[#7C3AED]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED]">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!form.watch(`variants.${index}.isDefault`) && (
                        <button type="button" onClick={() => {
                          variantFields.forEach((_, i) => form.setValue(`variants.${i}.isDefault`, i === index));
                        }} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-[#F8FAFC]">
                          Set default
                        </button>
                      )}
                      {variantFields.length > 1 && (
                        <button type="button" onClick={() => removeVariant(index)} className="text-rose-400 hover:text-rose-300">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">SKU <span className="text-red-500">*</span></Label>
                      <Input className="h-8 border-border bg-card text-[#F8FAFC]" {...form.register(`variants.${index}.sku`)} />
                      {errors[`variants.${index}.sku`] && <p className="text-[10px] text-rose-400">{errors[`variants.${index}.sku`]}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Price <span className="text-red-500">*</span></Label>
                      <Controller control={form.control} name={`variants.${index}.price`} render={({ field: f }) => (
                        <Input type="number" step="0.01" className="h-8 border-border bg-card text-[#F8FAFC]" value={f.value || ""} onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Compare</Label>
                      <Controller control={form.control} name={`variants.${index}.comparePrice`} render={({ field: f }) => (
                        <Input type="number" step="0.01" className="h-8 border-border bg-card text-[#F8FAFC]" value={f.value ?? ""} onChange={(e) => f.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Cost</Label>
                      <Controller control={form.control} name={`variants.${index}.costPrice`} render={({ field: f }) => (
                        <Input type="number" step="0.01" className="h-8 border-border bg-card text-[#F8FAFC]" value={f.value ?? ""} onChange={(e) => f.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Qty</Label>
                      <Controller control={form.control} name={`variants.${index}.quantity`} render={({ field: f }) => (
                        <Input type="number" className="h-8 border-border bg-card text-[#F8FAFC]" value={f.value ?? 0} onChange={(e) => f.onChange(parseInt(e.target.value) || 0)} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Status</Label>
                      <select className="h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-[#F8FAFC] outline-none" {...form.register(`variants.${index}.status`)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] disabled:opacity-50">
              {saving ? "Saving..." : product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
