import { NextRequest, NextResponse } from "next/server";
import { searchTexts } from "@/lib/texts";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }
  const results = await searchTexts(q.trim());
  return NextResponse.json(results);
}
