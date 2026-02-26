import { NextRequest, NextResponse } from "next/server";
import { getTextsByTradition, searchTexts } from "@/lib/texts";

export async function GET(request: NextRequest) {
  const tradition = request.nextUrl.searchParams.get("tradition");
  const search = request.nextUrl.searchParams.get("search");

  if (search) {
    const results = await searchTexts(search);
    return NextResponse.json(results);
  }

  if (tradition) {
    const texts = await getTextsByTradition(tradition);
    return NextResponse.json(texts);
  }

  return NextResponse.json([]);
}
