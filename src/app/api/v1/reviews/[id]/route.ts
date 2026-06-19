import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getTenantId } from "@/lib/api-helpers";
import { reviewUpdateSchema } from "@/lib/schemas";
import { updateReview, deleteReview, getReviewDetail } from "@/lib/services/reviews";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const session = await getSessionUser();

    const tenantIdFromSession = session?.tenantId;
    const tenantIdFromHeader = request.headers.get("x-tenant-id");
    const tenantId = tenantIdFromSession || tenantIdFromHeader || "";

    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const review = await getReviewDetail(params.id, tenantId);
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (session?.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
      });
      if (!customer || review.customerId !== customer.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(review);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const body = await request.json();
    const parsed = reviewUpdateSchema.parse(body);

    const updated = await updateReview(
      params.id,
      parsed as { rating?: number; title?: string; body?: string; images?: Array<{ url: string; alt?: string; sortOrder?: number }> },
      customer.id,
      session.tenantId!,
    );

    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    await deleteReview(params.id, customer.id, session.tenantId!);

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
