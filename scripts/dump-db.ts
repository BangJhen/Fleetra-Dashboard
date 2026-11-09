import { execSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { mysqlPool, isMysqlBackend, closeMysqlPool } from "../src/lib/mysql";

async function main() {
  console.log("Memulai ekspor database dan state dummy FLEETRA...");

  // 1. Export MariaDB SQL dump if credentials exist
  const cnfFile = process.env.FLEETRA_DB_CONFIG || path.join(process.cwd(), ".data", "fleetra-db.cnf");
  const dumpPath = path.resolve(process.cwd(), "database/fleetra_dump.sql");

  if (existsSync(cnfFile)) {
    try {
      execSync(`mariadb-dump --defaults-file="${cnfFile}" --skip-lock-tables --databases fleetra --add-drop-table > "${dumpPath}"`, { stdio: "inherit" });
      console.log(`✓ database/fleetra_dump.sql berhasil diekspor via mariadb-dump.`);
    } catch {
      try {
        execSync(`mysqldump --defaults-file="${cnfFile}" --skip-lock-tables --databases fleetra --add-drop-table > "${dumpPath}"`, { stdio: "inherit" });
        console.log(`✓ database/fleetra_dump.sql berhasil diekspor via mysqldump.`);
      } catch (err: any) {
        console.warn("Peringatan: Gagal mengekspor via CLI dump:", err?.message);
      }
    }
  } else if (process.env.FLEETRA_DB_USER && process.env.FLEETRA_DB_PASSWORD) {
    const host = process.env.FLEETRA_DB_HOST || "127.0.0.1";
    const port = process.env.FLEETRA_DB_PORT || "3306";
    const user = process.env.FLEETRA_DB_USER;
    const pass = process.env.FLEETRA_DB_PASSWORD;
    const db = process.env.FLEETRA_DB_NAME || "fleetra";
    try {
      execSync(`mariadb-dump -h ${host} -P ${port} -u ${user} -p${pass} --skip-lock-tables --databases ${db} --add-drop-table > "${dumpPath}"`, { stdio: "inherit" });
      console.log(`✓ database/fleetra_dump.sql berhasil diekspor.`);
    } catch (err: any) {
      console.warn("Peringatan: Gagal mengekspor via CLI dump:", err?.message);
    }
  }

  // 2. Export JSON state snapshot from .data/fleetra.json or database/seed-state.json
  const dataJson = path.resolve(process.cwd(), ".data/fleetra.json");
  const targetJson = path.resolve(process.cwd(), "database/seed-state.json");
  if (existsSync(dataJson)) {
    const content = readFileSync(dataJson, "utf8");
    writeFileSync(targetJson, content, "utf8");
    console.log(`✓ database/seed-state.json berhasil disinkronkan dari .data/fleetra.json.`);
  } else if (existsSync(targetJson)) {
    console.log(`✓ database/seed-state.json sudah ada.`);
  }
}

main()
  .catch((e) => {
    console.error("Gagal melakukan dump:", e.message);
    process.exitCode = 1;
  })
  .finally(closeMysqlPool);
