import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/request";
import { registerAccount } from "@/lib/accounts";
import { makeSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  try {
    const raw = await req.text();
    if (raw.length > 4096)
      return NextResponse.json(
        { error: "Formulir terlalu besar." },
        { status: 413 },
      );
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw Error("Formulir tidak valid.");
    const account = await registerAccount(body);
    const res = NextResponse.json({ ok: true }, { status: 201 });
    res.cookies.set("fleetra-session", makeSession(account.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 28800,
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Pendaftaran gagal. Coba lagi.",
      },
      { status: 400 },
    );
  }
}
