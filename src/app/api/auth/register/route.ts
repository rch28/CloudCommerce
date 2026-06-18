import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateSessionToken, getSessionExpiry, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = hashPassword(password);
    const userRole = role === "admin" || role === "merchant" ? role : "customer";

    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: userRole },
    });

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
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
