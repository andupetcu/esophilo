import { NextResponse } from "next/server";
import { traditions } from "@/lib/traditions";
import { safeQuery } from "@/lib/db";

export async function GET() {
  // Try to get text counts from DB
  const result = await safeQuery(
    `SELECT tr.slug, COUNT(t.id) as text_count
     FROM traditions tr
     LEFT JOIN texts t ON t.tradition_id = tr.id
     GROUP BY tr.slug`
  );

  const countMap: Record<string, number> = {};
  if (result) {
    for (const row of result.rows) {
      countMap[row.slug] = parseInt(row.text_count);
    }
  }

  const data = traditions.map((t) => ({
    ...t,
    textCount: countMap[t.slug] || t.textCount,
  }));

  return NextResponse.json(data);
}
