import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getTenantId, requirePermission } from "@/lib/api-helpers";
import { reviewSchema } from "@/lib/schemas";
import { createReview, listReviews, validateReviewEligibility } from "@/lib/services/reviews";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  const status = sp.get("status") || undefined;
  const productId = sp.get("productId") || undefined;

  const tenantId = request.headers.get("x-tenant-id");

  if (tenantId) {
    const forbidden = requirePermission(request, "read");
    if (forbidden) return forbidden;

    const result = await listReviews(tenantId, { productId, status, page, pageSize });
    return NextResponse.json(result);
  }

  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    if (!customer) return NextResponse.json({ reviews: [], total: 0 });

    const result = await listReviews(session.tenantId!, {
      customerId: customer.id, page, pageSize,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const body = await request.json();
    const parsed = reviewSchema.parse(body);

    const eligibility = await validateReviewEligibility({
      customerId: customer.id,
      orderItemId: parsed.orderItemId,
      tenantId: session.tenantId!,
    });

    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.error }, { status: 400 });
    }

    const review = await createReview({
      productId: parsed.productId,
      orderItemId: parsed.orderItemId,
      customerId: customer.id,
      tenantId: session.tenantId!,
      rating: parsed.rating,
      title: parsed.title,
      body: parsed.body,
      images: parsed.images as Array<{ url: string; alt?: string; sortOrder?: number }>,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
