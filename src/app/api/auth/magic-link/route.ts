import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Ensure user exists
  await safeQuery(
    "INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
    [email]
  );

  // Create magic link
  await safeQuery(
    "INSERT INTO magic_links (email, token, expires_at) VALUES ($1, $2, $3)",
    [email, token, expiresAt]
  );

  // TODO: Send magic links via an email provider (e.g., Resend) for production delivery.
  const verifyUrl = `${process.env.SITE_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`;

  return NextResponse.json({
    message: "Magic link generated. Open the verification link to sign in.",
    verifyUrl,
  });
}
