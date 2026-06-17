"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import type { Product } from "@/data/mock";

type FormValues = {
  name: string;
  description?: string;
  status: "active" | "draft" | "archived";
  categoryId?: string;
  variants: {
    sku: string;
    price: number;
    comparePrice?: number;
    quantity: number;
    isDefault: boolean;
  }[];
};

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSave: (data: FormValues) => void;
}

export default function ProductForm({ open, onOpenChange, product, onSave }: ProductFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      categoryId: "",
      variants: [{ sku: "", price: 0, quantity: 0, isDefault: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: "",
        status: product.status,
        categoryId: product.category,
        variants: product.variants.map((_, i) => ({
          sku: `SKU-${product.id}-${i}`,
          price: product.price,
          quantity: product.stock,
          isDefault: i === 0,
        })),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        status: "active",
        categoryId: "",
        variants: [{ sku: "", price: 0, quantity: 0, isDefault: true }],
      });
    }
  }, [product, open, form]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.getValues();
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    data.variants.forEach((v, i) => {
      if (!v.sku.trim()) newErrors[`variants.${i}.sku`] = "SKU is required";
      if (!v.price || v.price <= 0) newErrors[`variants.${i}.price`] = "Price must be positive";
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSave(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card text-[#F8FAFC]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {product ? "Update product details and variants" : "Create a new product with variants"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" className="border-border bg-background text-[#F8FAFC]" {...form.register("name")} />
                {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  {...form.register("status")}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                {...form.register("description")}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ sku: "", price: 0, quantity: 0, isDefault: fields.length === 0 })}
                className="border-border text-muted-foreground hover:text-[#F8FAFC]"
              >
                <Plus size={14} className="mr-1" /> Add Variant
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Variant {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-rose-400 hover:text-rose-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">SKU</Label>
                    <Input className="h-8 border-border bg-card text-[#F8FAFC]" {...form.register(`variants.${index}.sku`)} />
                    {errors[`variants.${index}.sku`] && <p className="text-[10px] text-rose-400">{errors[`variants.${index}.sku`]}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Price</Label>
                    <Controller
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 border-border bg-card text-[#F8FAFC]"
                          value={f.value || ""}
                          onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {errors[`variants.${index}.price`] && <p className="text-[10px] text-rose-400">{errors[`variants.${index}.price`]}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Compare at</Label>
                    <Controller
                      control={form.control}
                      name={`variants.${index}.comparePrice`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 border-border bg-card text-[#F8FAFC]"
                          value={f.value ?? ""}
                          onChange={(e) => f.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Quantity</Label>
                    <Controller
                      control={form.control}
                      name={`variants.${index}.quantity`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          className="h-8 border-border bg-card text-[#F8FAFC]"
                          value={f.value ?? 0}
                          onChange={(e) => f.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
