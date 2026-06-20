import Image from "next/image";

interface ImageRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  tenant: string;
}

export default function ImageRenderer({ content }: ImageRendererProps) {
  const src = content.src as string;
  const alt = (content.alt as string) || "";
  const caption = content.caption as string;

  if (!src) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-xl">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={675}
            className="h-auto w-full object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>
        {caption && (
          <p className="mt-3 text-center text-sm text-muted-foreground">{caption}</p>
        )}
      </div>
    </section>
  );
}
