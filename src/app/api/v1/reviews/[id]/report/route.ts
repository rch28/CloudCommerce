import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { reportSchema } from "@/lib/schemas";
import { reportReview } from "@/lib/services/reviews";

export async function POST(
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
    const parsed = reportSchema.parse(body);

    const report = await reportReview(
      params.id,
      parsed.reason,
      parsed.description,
      customer.id,
      session.tenantId!,
    );

    return NextResponse.json(report, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
