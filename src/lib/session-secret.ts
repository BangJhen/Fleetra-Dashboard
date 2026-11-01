import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export function sessionSecret(
  dataDirectory = process.env.FLEETRA_DATA_DIR || ".data",
  configuredSecret = process.env.SESSION_SECRET,
) {
  if (configuredSecret) return configuredSecret;

  const directory = path.resolve(/* turbopackIgnore: true */ process.cwd(), dataDirectory);
  const file = path.join(directory, "session-secret");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(file, randomBytes(32).toString("hex"), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const secret = readFileSync(file, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(secret)) throw Error("Kunci sesi lokal tidak valid.");
  return secret;
}
