const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isSlug(value: string): boolean {
  return slugRe.test(value);
}

export function ensureSlug(input: string): string {
  if (slugRe.test(input)) return input;
  return generateSlug(input);
}
