import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false, user: null });
  }

  return NextResponse.json({
    loggedIn: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  });
}
