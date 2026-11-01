import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { getRegisteredProfile } from "./accounts";
const globals = globalThis as typeof globalThis & { fleetraSecret?: string };
const secret =
  process.env.SESSION_SECRET ||
  globals.fleetraSecret ||
  randomBytes(32).toString("hex");
globals.fleetraSecret = secret;
export function makeSession(userId = "demo") {
  const payload = `${userId}.${Date.now() + 8 * 60 * 60 * 1000}`;
  return (
    payload + "." + createHmac("sha256", secret).update(payload).digest("hex")
  );
}
export async function sessionUserId(): Promise<string | null> {
  const token = (await cookies()).get("fleetra-session")?.value;
  if (!token) return null;
  const [id, expiry, sig, ...extra] = token.split(".");
  if (
    extra.length ||
    !id ||
    !(id === "demo" || /^[a-f0-9-]{36}$/.test(id)) ||
    !/^\d{13}$/.test(expiry || "") ||
    !/^\w{64}$/.test(sig || "") ||
    Number(expiry) < Date.now()
  )
    return null;
  const expected = createHmac("sha256", secret)
    .update(`${id}.${expiry}`)
    .digest("hex");
  if (
    Buffer.byteLength(sig) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    return null;
  return id === "demo" || (await getRegisteredProfile(id)) ? id : null;
}
export async function isAuthenticated() {
  return !!(await sessionUserId());
}
