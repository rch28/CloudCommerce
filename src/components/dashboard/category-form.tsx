"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { categorySchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

type FormValues = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  status: "active" | "inactive" | "archived";
};

interface Category {
  id: string; name: string; slug: string; description: string | null;
  image: string | null; parentId: string | null; status: string;
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  categories: Category[];
  onSave: (data: FormValues) => Promise<void>;
}

export default function CategoryForm({ open, onOpenChange, category, categories, onSave }: CategoryFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: "", slug: "", description: "", image: "", parentId: "", status: "active",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        image: category.image ?? "",
        parentId: category.parentId ?? "",
        status: category.status as FormValues["status"],
      });
    } else {
      form.reset({
        name: "", slug: "", description: "", image: "", parentId: "", status: "active",
      });
    }
  }, [category, open, form]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.getValues();
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.slug.trim()) newErrors.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) newErrors.slug = "Invalid slug format";

    // Validate with zod
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        newErrors[issue.path.join(".")] = issue.message;
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

  const parentOptions = categories.filter((c) => c.id !== category?.id && c.status !== "archived");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card text-[#F8FAFC]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {category ? "Update category details" : "Create a new category to organize your products"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input id="name" className="border-border bg-background text-[#F8FAFC]" {...form.register("name")} />
              {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
              <Input id="slug" className="border-border bg-background text-[#F8FAFC]" {...form.register("slug")} />
              {errors.slug && <p className="text-xs text-rose-400">{errors.slug}</p>}
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

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" className="border-border bg-background text-[#F8FAFC]" placeholder="https://..." {...form.register("image")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Category</Label>
              <select
                id="parentId"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                {...form.register("parentId")}
              >
                <option value="">None (top level)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                {...form.register("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
