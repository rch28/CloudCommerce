import Link from "next/link";

interface BannerRendererProps {
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  brandColor: string;
  tenant: string;
}

export default function BannerRenderer({ content, styles, brandColor }: BannerRendererProps) {
  const bgColor = (styles.bgColor as string) || brandColor;
  const textColor = (styles.textColor as string) || "#FFFFFF";
  const message = content.message as string | undefined;
  const linkUrl = content.linkUrl as string | undefined;
  const linkText = content.linkText as string | undefined;

  return (
    <div
      className="px-4 py-3 text-center text-sm font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span>{message}</span>
      {linkUrl && linkText && (
        <Link
          href={linkUrl}
          className="ml-2 underline transition-opacity hover:opacity-80"
          style={{ color: textColor }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
