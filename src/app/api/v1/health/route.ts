import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testQueueConnection } from "@/lib/queue/connection";

// Health endpoint: returns opaque status only — no internal topology details.
export async function GET() {
  const dbStatus = await checkDatabase();
  const queueOk = await testQueueConnection();

  const healthy = dbStatus === "ok" && queueOk === true;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}

async function checkDatabase(): Promise<string> {
  try {
    if (!process.env.DATABASE_URL) return "mock";
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}
