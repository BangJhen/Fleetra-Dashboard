import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

const globalDb = globalThis as typeof globalThis & { fleetraMysql?: Pool };
export async function closeMysqlPool() {
  const pool = globalDb.fleetraMysql;
  delete globalDb.fleetraMysql;
  if (pool) await pool.end();
}
export function isMysqlBackend() {
  if (process.env.FLEETRA_DATA_BACKEND === "mysql") return true;
  if (process.env.FLEETRA_DATA_BACKEND === "file") return false;
  if (process.env.FLEETRA_TEST_SERVER === "1") return false;
  const filename =
    process.env.FLEETRA_DB_CONFIG ||
    path.join(process.cwd(), ".data", "fleetra-db.cnf");
  return existsSync(/* turbopackIgnore: true */ filename);
}
export function mysqlPool(): Pool {
  if (globalDb.fleetraMysql) return globalDb.fleetraMysql;
  const filename =
    process.env.FLEETRA_DB_CONFIG ||
    path.join(process.cwd(), ".data", "fleetra-db.cnf");
  if (!existsSync(/* turbopackIgnore: true */ filename)) {
    throw Error(
      `Konfigurasi database tidak ditemukan di '${filename}'. Gunakan FLEETRA_DATA_BACKEND=file atau sediakan file konfigurasi fleetra-db.cnf.`,
    );
  }
  const config = readFileSync(/* turbopackIgnore: true */ filename, "utf8");
  const user = config.match(/^user=(.+)$/m)?.[1]?.trim();
  const password = config.match(/^password=(.+)$/m)?.[1]?.trim();
  if (!user || !password)
    throw Error("Konfigurasi akun database FLEETRA tidak lengkap.");
  const isWindows = process.platform === "win32";
  const socketPath =
    process.env.FLEETRA_DB_SOCKET || (isWindows ? undefined : "/tmp/mysql.sock");
  const host =
    process.env.FLEETRA_DB_HOST || (socketPath ? undefined : "127.0.0.1");
  const port = process.env.FLEETRA_DB_PORT
    ? Number(process.env.FLEETRA_DB_PORT)
    : 3306;

  globalDb.fleetraMysql = mysql.createPool({
    user,
    password,
    database: process.env.FLEETRA_DB_NAME || "fleetra",
    ...(socketPath ? { socketPath } : { host, port }),
    connectionLimit: 5,
    timezone: "Z",
    dateStrings: true,
    decimalNumbers: true,
    charset: "utf8mb4",
  });
  return globalDb.fleetraMysql;
}
