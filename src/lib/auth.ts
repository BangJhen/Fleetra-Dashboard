import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
const secret =
  process.env.SESSION_SECRET ||
  (globalThis as typeof globalThis & { fleetraSecret?: string })
    .fleetraSecret ||
  randomBytes(32).toString("hex");
(globalThis as typeof globalThis & { fleetraSecret?: string }).fleetraSecret =
  secret;
export function makeSession() {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000);
  return (
    expiry + "." + createHmac("sha256", secret).update(expiry).digest("hex")
  );
}
export async function isAuthenticated() {
  const token = (await cookies()).get("fleetra-session")?.value;
  if (!token) return false;
  const parts = token.split(".");
  const [expires, sig] = parts;
  if (
    parts.length !== 2 ||
    !/^\d{13}$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(sig ?? "") ||
    Number(expires) < Date.now()
  )
    return false;
  const expected = createHmac("sha256", secret).update(expires).digest("hex");
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}
