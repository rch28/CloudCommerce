/**
 * Older seeds stored page sections with legacy types ("content", "features")
 * and legacy content keys (heading/subheading/buttonText/buttonLink).
 * Normalize them to the current block format so both the storefront renderer
 * and the CMS editor understand pages created before the format change.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function normalizeSection<T extends { type: string; content: Record<string, unknown> | null }>(section: T): T {
  const raw = (section.content ?? {}) as Record<string, unknown>;
  let type = section.type;

  // Legacy "features" blocks become rich-text lists
  if (type === "features") {
    const items = Array.isArray(raw.features) ? (raw.features as { title?: unknown; description?: unknown }[]) : [];
    const heading = String(raw.heading ?? raw.title ?? "");
    const body =
      (heading ? `<h2>${escapeHtml(heading)}</h2>` : "") +
      `<ul>${items.map((f) => `<li><strong>${escapeHtml(String(f.title ?? ""))}</strong> — ${escapeHtml(String(f.description ?? ""))}</li>`).join("")}</ul>`;
    return { ...section, type: "text", content: { body } };
  }

  if (type === "content") type = "text";

  const content: Record<string, unknown> = { ...raw };
  if (content.title == null && content.heading != null) content.title = content.heading;
  // The text renderer reads `body`; legacy text blocks used other key names.
  if (type === "text" && content.body == null) {
    content.body = content.html ?? content.text ?? content.content ?? "";
  }
  if (content.subheading != null) {
    if (type === "cta" && content.description == null) content.description = content.subheading;
    else if (content.subtitle == null) content.subtitle = content.subheading;
  }
  if (type === "hero") {
    if (content.ctaText == null && content.buttonText != null) content.ctaText = content.buttonText;
    if (content.ctaLink == null && content.buttonLink != null) content.ctaLink = content.buttonLink;
  }

  return { ...section, type, content };
}
