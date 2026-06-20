interface TextRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  tenant: string;
}

export default function TextRenderer({ content }: TextRendererProps) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div
          className="prose prose-invert prose-sm sm:prose-base max-w-none"
          dangerouslySetInnerHTML={{ __html: (content.body as string) || "" }}
        />
      </div>
    </section>
  );
}
