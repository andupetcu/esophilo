import { NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";

export async function GET() {
  // Try to get today's wisdom from DB
  const result = await safeQuery(
    `SELECT dw.passage, dw.modern_interpretation, t.name as tradition_name, t.icon as tradition_icon
     FROM daily_wisdom dw
     LEFT JOIN traditions t ON t.id = dw.tradition_id
     WHERE dw.date = CURRENT_DATE
     LIMIT 1`
  );

  if (result && result.rows.length > 0) {
    return NextResponse.json(result.rows[0]);
  }

  // Fallback
  return NextResponse.json({
    passage: "The unexamined life is not worth living.",
    author: "Socrates",
    source: "Apology by Plato",
    tradition_name: "Greek Philosophy",
    tradition_icon: "🏛️",
  });
}
