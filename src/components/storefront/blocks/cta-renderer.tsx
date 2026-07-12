import Link from "next/link";

interface CtaRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  secondaryColor: string;
  tenant: string;
}

export default function CtaRenderer({ content, brandColor }: CtaRendererProps) {
  const alignment = (content.alignment as string) || "center";
  const title = content.title as string | undefined;
  const description = content.description as string | undefined;
  const buttonText = content.buttonText as string | undefined;
  const buttonLink = content.buttonLink as string | undefined;

  return (
    <section className="border-b border-border">
      <div
        className="mx-auto max-w-3xl px-4 py-20 sm:px-6"
        style={{ textAlign: alignment as any }}
      >
        {title && (
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-4 text-lg text-muted-foreground">
            {description}
          </p>
        )}
        {buttonText && buttonLink && (
          <div className="mt-8">
            <Link
              href={buttonLink}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              {buttonText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
