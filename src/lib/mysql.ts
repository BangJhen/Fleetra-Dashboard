import { readFileSync } from "node:fs";
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
  return (
    process.env.FLEETRA_DATA_BACKEND === "mysql" ||
    (process.env.FLEETRA_TEST_SERVER !== "1" &&
      process.env.FLEETRA_DATA_BACKEND !== "file")
  );
}
export function mysqlPool(): Pool {
  if (globalDb.fleetraMysql) return globalDb.fleetraMysql;
  const filename =
    process.env.FLEETRA_DB_CONFIG ||
    path.join(process.cwd(), ".data", "fleetra-db.cnf");
  const config = readFileSync(/* turbopackIgnore: true */ filename, "utf8");
  const user = config.match(/^user=(.+)$/m)?.[1]?.trim();
  const password = config.match(/^password=(.+)$/m)?.[1]?.trim();
  if (!user || !password)
    throw Error("Konfigurasi akun database FLEETRA tidak lengkap.");
  globalDb.fleetraMysql = mysql.createPool({
    user,
    password,
    database: process.env.FLEETRA_DB_NAME || "fleetra",
    socketPath: process.env.FLEETRA_DB_SOCKET || "/tmp/mysql.sock",
    connectionLimit: 5,
    timezone: "Z",
    dateStrings: true,
    decimalNumbers: true,
    charset: "utf8mb4",
  });
  return globalDb.fleetraMysql;
}
