import { prisma } from "@/lib/prisma";
import { getSessionToken } from "@/lib/auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}
