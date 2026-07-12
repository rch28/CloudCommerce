import Link from "next/link";

interface HeroRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  secondaryColor: string;
  tenant: string;
}

export default function HeroRenderer({ content, styles, brandColor, tenant }: HeroRendererProps) {
  const alignment = (content.alignment as string) || "left";
  const title = content.title as string | undefined;
  const subtitle = content.subtitle as string | undefined;
  const ctaText = content.ctaText as string | undefined;
  const ctaLink = content.ctaLink as string | undefined;
  const bgImage = content.backgroundImage as string | undefined;
  const alignClass = alignment === "center" ? "text-center items-center" : alignment === "right" ? "text-right items-end" : "text-left items-start";

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{
        ...(bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: `linear-gradient(135deg, ${brandColor}22, transparent)` }),
      }}
    >
      <div className="relative mx-auto flex min-h-[400px] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:py-32">
        <div className={`flex flex-col ${alignClass} max-w-2xl`}>
          {title && (
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              {subtitle}
            </p>
          )}
          {ctaText && ctaLink && (
            <Link
              href={ctaLink}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
