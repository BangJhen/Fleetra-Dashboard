import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { createSeed } from "./seed";
import type { FleetState } from "./types";
const directory = path.resolve(
  /* turbopackIgnore: true */
  process.cwd(),
  process.env.FLEETRA_DATA_DIR || ".data",
);
const file = path.join(directory, "fleetra.json");
// Shared only for serialization across Next.js route bundles in this one Node process.
const processState = globalThis as typeof globalThis & {
  fleetraQueues?: Map<string, Promise<unknown>>;
};
const queues = (processState.fleetraQueues ??= new Map());
async function read(): Promise<FleetState> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const s = createSeed();
    await save(s);
    return s;
  }
}
async function save(state: FleetState) {
  await mkdir(directory, { recursive: true });
  await writeFile(file + ".tmp", JSON.stringify(state));
  await rename(file + ".tmp", file);
}
export function transact<T>(
  fn: (s: FleetState) => T | Promise<T>,
  write = true,
): Promise<T> {
  const task = (queues.get(file) ?? Promise.resolve()).then(async () => {
    const s = await read();
    const result = await fn(s);
    if (write) {
      s.updatedAt = new Date().toISOString();
      await save(s);
    }
    return result;
  });
  queues.set(
    file,
    task.catch(() => {}),
  );
  return task;
}
export function getState() {
  return transact((s) => s, false);
}
