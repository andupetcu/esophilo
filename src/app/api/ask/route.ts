import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";

// In-memory rate limiting (resets on server restart)
const rateLimits = new Map<string, { count: number; date: string }>();

const SYSTEM_PROMPT = `You are EsoPhilo's "Ask the Sages" — an AI guide to humanity's ancient wisdom traditions. You have deep knowledge of 120+ texts spanning Hermetic, Gnostic, Kabbalistic, Buddhist, Hindu, Sufi, Taoist, Greek, Stoic, Neoplatonic, Medieval, Renaissance, Theosophical, and Western Occult traditions.

When answering questions:
1. Draw from SPECIFIC texts and passages — always cite your sources
2. Present multiple traditions' perspectives when relevant
3. Use plain, accessible language — explain archaic concepts clearly
4. Be reverent but not preachy — treat all traditions with equal respect
5. Format citations as: [Author, "Title", Chapter/Section]
6. If asked about a specific text, quote relevant passages directly
7. Never invent quotes — only reference actual texts in the library
8. Suggest related readings from the library

You speak with warmth and depth, like a wise librarian who has read everything and remembers it all.`;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const today = new Date().toISOString().slice(0, 10);

  // Rate limiting: 3/day for unauthenticated
  const limit = rateLimits.get(ip);
  if (limit && limit.date === today && limit.count >= 3) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Upgrade to Pro for unlimited access." },
      { status: 429 }
    );
  }

  // Update rate limit
  if (!limit || limit.date !== today) {
    rateLimits.set(ip, { count: 1, date: today });
  } else {
    limit.count++;
  }

  const body = await request.json();
  const { message, history = [] } = body;

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // RAG: search for relevant passages
  let contextPassages = "";
  const searchResult = await safeQuery(
    `SELECT c.content, c.title as chapter_title, t.title as text_title, a.name as author_name
     FROM chapters c
     JOIN texts t ON t.id = c.text_id
     JOIN authors a ON a.id = t.author_id
     WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
     ORDER BY ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $1)) DESC
     LIMIT 5`,
    [message]
  );

  if (searchResult && searchResult.rows.length > 0) {
    contextPassages =
      "\n\nRelevant passages from the library:\n" +
      searchResult.rows
        .map(
          (r: Record<string, string>, i: number) =>
            `[${i + 1}] From "${r.text_title}" by ${r.author_name} (${r.chapter_title || "Chapter"}):\n${r.content.substring(0, 500)}...`
        )
        .join("\n\n");
  }

  // Call Azure OpenAI
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_KEY;

    if (!endpoint || !key) {
      return NextResponse.json({
        content:
          "I apologize, but the AI service is not configured yet. Please check back soon.",
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextPassages },
      ...history
        .slice(-10)
        .map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      { role: "user", content: message },
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key,
      },
      body: JSON.stringify({
        input: messages,
      }),
    });

    if (!response.ok) {
      console.error("Azure OpenAI error:", await response.text());
      return NextResponse.json({
        content:
          "I encountered an issue connecting to my knowledge base. Please try again shortly.",
      });
    }

    const data = await response.json();
    const assistantContent =
      data.output?.[0]?.content?.[0]?.text ||
      data.choices?.[0]?.message?.content ||
      "I was unable to formulate a response. Please try rephrasing your question.";

    return NextResponse.json({ content: assistantContent });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({
      content:
        "I encountered an unexpected issue. Please try again shortly.",
    });
  }
}
