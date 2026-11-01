import type { NextRequest } from "next/server";
/** Compare against the incoming Host, because a local bind address can differ from nextUrl. */
export function sameOrigin(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (!origin) return false;
    const parsed = new URL(origin);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.host === req.headers.get("host")
    );
  } catch {
    return false;
  }
}
