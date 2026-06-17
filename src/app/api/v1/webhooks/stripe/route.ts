import { NextResponse } from "next/server";
import { handleWebhook } from "@/lib/webhooks/handler";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let eventType = "unknown";
  try {
    const parsed = JSON.parse(rawBody);
    eventType = parsed.type || "unknown";
  } catch { /* use raw body */ }

  const result = await handleWebhook({ provider: "stripe", eventType, rawBody });
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
