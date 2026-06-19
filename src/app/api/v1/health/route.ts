import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testQueueConnection } from "@/lib/queue/connection";
import { getAllQueueHealth } from "@/lib/queue/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  checks.database = await checkDatabase();
  checks.queueConnection = await testQueueConnection();
  checks.queues = await getAllQueueHealth();

  const healthy = checks.database === "ok" && checks.queueConnection === true;
  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status },
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
