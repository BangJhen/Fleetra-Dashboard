import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { OperatorProfile } from "./types";
export interface RegisteredAccount {
  id: string;
  loginEmail: string;
  passwordHash: string;
  salt: string;
  profile: OperatorProfile;
  createdAt: string;
}
const dir = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.FLEETRA_DATA_DIR || ".data",
);
const file = path.join(dir, "accounts.json");
const processState = globalThis as typeof globalThis & {
  fleetraAccountQueues?: Map<string, Promise<unknown>>;
};
const queues = (processState.fleetraAccountQueues ??= new Map());
async function read(): Promise<RegisteredAccount[]> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
function transaction<T>(
  fn: (users: RegisteredAccount[]) => Promise<T> | T,
  write = false,
): Promise<T> {
  const task = (queues.get(file) || Promise.resolve()).then(async () => {
    const users = await read();
    const result = await fn(users);
    if (write) {
      await mkdir(dir, { recursive: true });
      await writeFile(file + ".tmp", JSON.stringify(users), { mode: 0o600 });
      await rename(file + ".tmp", file);
    }
    return result;
  });
  queues.set(
    file,
    task.catch(() => {}),
  );
  return task;
}
function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key)),
    ),
  );
}
function registrationValues(body: Record<string, unknown>) {
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 80
  )
    throw Error("Nama wajib diisi dengan maksimal 80 karakter.");
  if (
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.email.trim())
  )
    throw Error("Email tidak valid.");
  if (
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    !body.password.trim() ||
    body.password.length > 128
  )
    throw Error("Kata sandi harus berisi 12 sampai 128 karakter.");
  if (body.confirmPassword !== body.password)
    throw Error("Konfirmasi kata sandi tidak cocok.");
  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}
export async function registerAccount(body: Record<string, unknown>) {
  const values = registrationValues(body);
  return transaction(async (users) => {
    if (
      values.email === "manager@fleetra.demo" ||
      users.some((u) => u.loginEmail === values.email)
    )
      throw Error(
        "Email sudah terdaftar. Gunakan email lain atau masuk ke akun Anda.",
      );
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await derive(values.password, salt)).toString("hex");
    const account: RegisteredAccount = {
      id: crypto.randomUUID(),
      loginEmail: values.email,
      passwordHash,
      salt,
      profile: {
        name: values.name,
        email: values.email,
        phone: "",
        version: 0,
      },
      createdAt: new Date().toISOString(),
    };
    users.push(account);
    return { id: account.id };
  }, true);
}
export async function verifyAccount(email: unknown, password: unknown) {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length > 128
  )
    return null;
  return transaction(async (users) => {
    const user = users.find((u) => u.loginEmail === email.trim().toLowerCase());
    const candidate = await derive(
      password,
      user?.salt || "fleetra-login-dummy-salt",
    );
    if (!user) return null;
    const expected = Buffer.from(user.passwordHash, "hex");
    return expected.length === candidate.length &&
      timingSafeEqual(expected, candidate)
      ? user.id
      : null;
  });
}
export function getRegisteredProfile(id: string) {
  return transaction(
    (users) => users.find((u) => u.id === id)?.profile || null,
  );
}
export async function saveRegisteredProfile(
  id: string,
  body: Record<string, unknown>,
) {
  return transaction(async (users) => {
    const user = users.find((u) => u.id === id);
    if (!user) throw Error("Akun tidak ditemukan. Masuk kembali.");
    const { validateOperatorProfile } = await import("./operator-profile");
    user.profile = validateOperatorProfile(user.profile, body);
    return { id: user.id };
  }, true);
}
