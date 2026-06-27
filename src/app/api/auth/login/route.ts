import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateSessionToken, getSessionExpiry, setSessionCookie, DUMMY_PASSWORD_HASH } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always run a password verification (against a dummy hash when the user is
    // unknown) so both branches take the same time — prevents account enumeration.
    const passwordValid = verifyPassword(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = generateSessionToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: getSessionExpiry(),
      },
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("[auth/login] error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
