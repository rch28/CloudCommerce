import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
    wishlist: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    wishlistItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/get-session", () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

function mockRequest(method: string, url: string, opts?: { body?: any; cookie?: string; headerTenant?: string }) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (opts?.headerTenant) headers.set("x-tenant-id", opts.headerTenant);

  const cookieStr = opts?.cookie ? `cc_cart_session=${opts.cookie}` : "";
  if (cookieStr) headers.set("Cookie", cookieStr);

  return new NextRequest(url, {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
}

describe("Wishlist API - GET /api/v1/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty items for unauthenticated guest", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const { GET } = await import("@/app/api/v1/wishlist/route");
    const request = mockRequest("GET", "http://localhost/api/v1/wishlist");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
  });

  it("returns 401 for add without auth", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const { POST } = await import("@/app/api/v1/wishlist/route");
    const request = mockRequest("POST", "http://localhost/api/v1/wishlist", {
      body: { variantId: "var-1" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Not authenticated");
  });
});

describe("Wishlist API - count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 count for unauthenticated guest", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const { GET } = await import("@/app/api/v1/wishlist/count/route");
    const request = mockRequest("GET", "http://localhost/api/v1/wishlist/count");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(0);
  });
});

describe("Wishlist API - share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated share", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const { POST } = await import("@/app/api/v1/wishlist/share/route");
    const request = mockRequest("POST", "http://localhost/api/v1/wishlist/share");
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
  });
});

describe("Wishlist API - sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const { POST } = await import("@/app/api/v1/wishlist/sync/route");
    const request = mockRequest("POST", "http://localhost/api/v1/wishlist/sync", {
      body: { sessionId: "sess-1" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
  });
});

describe("Wishlist API - storefront shared view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for invalid share token", async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null);

    const { GET } = await import("@/app/api/v1/storefront/wishlist/[shareToken]/route");
    const request = mockRequest("GET", "http://localhost/api/v1/storefront/wishlist/invalid");

    const response = await GET(request, {
      params: Promise.resolve({ shareToken: "invalid" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Wishlist not found");
  });
});
