import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url));
  }

  const result = await safeQuery(
    "SELECT * FROM magic_links WHERE token = $1 AND used = FALSE AND expires_at > NOW()",
    [token]
  );

  if (!result || result.rows.length === 0) {
    return NextResponse.redirect(new URL("/auth/login?error=expired", request.url));
  }

  const magicLink = result.rows[0];

  // Mark as used
  await safeQuery("UPDATE magic_links SET used = TRUE WHERE id = $1", [magicLink.id]);

  // Get user
  const userResult = await safeQuery("SELECT * FROM users WHERE email = $1", [magicLink.email]);
  if (!userResult || userResult.rows.length === 0) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url));
  }

  const user = userResult.rows[0];
  const jwt = await createToken({
    id: user.id,
    email: user.email,
    is_pro: user.is_pro,
  });

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("auth-token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
}
