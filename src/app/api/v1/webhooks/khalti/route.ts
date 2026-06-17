import { NextResponse } from "next/server";
import { handleWebhook } from "@/lib/webhooks/handler";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let eventType = "payment.success";
  try {
    const parsed = JSON.parse(rawBody);
    eventType = parsed.event || parsed.status === "Completed" ? "payment.success" : "unknown";
  } catch { /* use default */ }

  const result = await handleWebhook({ provider: "khalti", eventType, rawBody });
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
