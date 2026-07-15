import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ loggedIn: false, user: null });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true, role: true, tenantId: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return NextResponse.json({ loggedIn: false, user: null });
    }

    return NextResponse.json({ loggedIn: true, user: session.user });
  } catch (error) {
    return NextResponse.json({ loggedIn: false, user: null });
  }
}
