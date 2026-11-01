import { sameOrigin } from "@/lib/request";
import { NextRequest, NextResponse } from "next/server";
import { makeSession } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  const payload = await req.json().catch(() => null);
  const body = payload && typeof payload === "object" ? payload : {};
  if (
    body.demo !== true &&
    (body.email !== "manager@fleetra.demo" || body.password !== "Fleetra2026!")
  )
    return NextResponse.json(
      { error: "Email atau kata sandi tidak sesuai dengan akun demo." },
      { status: 401 },
    );
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fleetra-session", makeSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 28800,
  });
  return res;
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("fleetra-session");
  return res;
}
