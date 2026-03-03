import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { NextRequest } from "next/server";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = join(process.cwd(), "public", "cards", ...path);
  
  if (!existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const body = readFileSync(filePath);

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    },
  });
}
