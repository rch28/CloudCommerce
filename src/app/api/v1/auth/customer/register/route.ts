import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerRegisterSchema } from "@/lib/schemas";
import {
  hashPassword,
  generateSessionToken,
  getSessionExpiry,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = customerRegisterSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json({ error: "Validation failed", messages: errors }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const { tenantId } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashed = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "customer",
        tenantId,
      },
    });

    await prisma.customer.upsert({
      where: { email_tenantId: { email, tenantId } },
      update: { name },
      create: { email, name, tenantId },
    });

    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Customer register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
