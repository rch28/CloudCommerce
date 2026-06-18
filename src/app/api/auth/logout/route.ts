import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionToken, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
