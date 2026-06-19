import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { voteSchema } from "@/lib/schemas";
import { voteReview } from "@/lib/services/reviews";

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
    const parsed = voteSchema.parse(body);

    const vote = await voteReview(params.id, customer.id, parsed.helpful, session.tenantId!);

    return NextResponse.json(vote);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to vote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
