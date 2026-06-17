import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },

  // Security headers applied at the server level (complement middleware)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-tenant-id, x-csrf-token" },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    remotePatterns: [
      { protocol: "https", hostname: "d64gsuwffb70l.cloudfront.net" },
      { protocol: "https", hostname: "**.stripe.com" },
    ],
  },

  // Performance tuning
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
  },

  // Compression
  compress: true,

  // Disable Next.js's default powered-by header
  poweredByHeader: false,
};

export default nextConfig;
