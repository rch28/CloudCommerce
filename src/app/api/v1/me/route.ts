import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const session = (await cookies()).get("session");

  if (!session) {
    return NextResponse.json({ loggedIn: false, user: null });
  }

  return NextResponse.json({
    loggedIn: true,
    user: {
      id: "1",
      name: "Admin User",
      email: "admin@cloudcommerce.com",
      role: "admin",
    },
  });
}
