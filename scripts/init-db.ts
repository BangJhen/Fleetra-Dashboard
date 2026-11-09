import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { isMysqlBackend, mysqlPool, closeMysqlPool } from "../src/lib/mysql";

async function main() {
  console.log("=== FLEETRA DATABASE & DUMMY SEED INITIALIZER ===");

  const dataDir = path.resolve(process.cwd(), process.env.FLEETRA_DATA_DIR || ".data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // 1. File-based fallback seed preparation
  const localJsonFile = path.join(dataDir, "fleetra.json");
  const seedJsonFile = path.resolve(process.cwd(), "database/seed-state.json");

  if (!existsSync(localJsonFile) && existsSync(seedJsonFile)) {
    const seedContent = readFileSync(seedJsonFile, "utf8");
    writeFileSync(localJsonFile, seedContent, "utf8");
    console.log("✓ File lokal .data/fleetra.json berhasil dibuat dari database/seed-state.json.");
  }

  // 2. MySQL / MariaDB initialization if configured
  if (isMysqlBackend()) {
    console.log("Memeriksa status MariaDB/MySQL...");
    try {
      const pool = mysqlPool();
      const [rows]: any = await pool.query("SHOW TABLES LIKE 'companies'");
      
      if (!rows || rows.length === 0) {
        console.log("Tabel belum ditemukan. Mengimpor skema dan seed dari database/fleetra_dump.sql...");
        const dumpPath = path.resolve(process.cwd(), "database/fleetra_dump.sql");
        if (!existsSync(dumpPath)) {
          throw new Error(`File dump tidak ditemukan di ${dumpPath}`);
        }

        // Execute dump using a connection with multipleStatements enabled
        let user = process.env.FLEETRA_DB_USER;
        let password = process.env.FLEETRA_DB_PASSWORD;
        const filename = process.env.FLEETRA_DB_CONFIG || path.join(process.cwd(), ".data", "fleetra-db.cnf");
        if ((!user || !password) && existsSync(filename)) {
          const config = readFileSync(filename, "utf8");
          user = config.match(/^user=(.+)$/m)?.[1]?.trim();
          password = config.match(/^password=(.+)$/m)?.[1]?.trim();
        }

        const host = process.env.FLEETRA_DB_HOST;
        const port = process.env.FLEETRA_DB_PORT ? Number(process.env.FLEETRA_DB_PORT) : 3306;
        const socketPath = process.env.FLEETRA_DB_SOCKET;

        const connectionConfig: mysql.ConnectionOptions = {
          user,
          password,
          multipleStatements: true,
          database: process.env.FLEETRA_DB_NAME || "fleetra",
          ...(host
            ? { host, port }
            : socketPath
              ? { socketPath }
              : process.platform === "darwin" && existsSync("/tmp/mysql.sock")
                ? { socketPath: "/tmp/mysql.sock" }
                : { host: "127.0.0.1", port }),
        };

        const conn = await mysql.createConnection(connectionConfig);
        try {
          const sqlDump = readFileSync(dumpPath, "utf8");
          await conn.query(sqlDump);
          console.log("✓ Berhasil mengimpor skema lengkap dan seluruh data seed!");
        } finally {
          await conn.end();
        }
      } else {
        const [counts]: any = await pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM vehicles) as vehicles,
            (SELECT COUNT(*) FROM drivers) as drivers,
            (SELECT COUNT(*) FROM trips) as trips,
            (SELECT COUNT(*) FROM users) as users
        `);
        const stats = counts[0];
        console.log(`✓ Basis data MariaDB sudah aktif dan terisi:`);
        console.log(`  - ${stats.vehicles} unit armada`);
        console.log(`  - ${stats.drivers} mitra pengemudi`);
        console.log(`  - ${stats.trips} data penugasan perjalanan`);
        console.log(`  - ${stats.users} akun pengguna sistem`);
      }
    } catch (err: any) {
      console.warn("Peringatan inisialisasi MySQL:", err.message);
      console.log("Aplikasi tetap dapat berjalan menggunakan fallback file (.data/fleetra.json).");
    }
  } else {
    console.log("Mode penyimpanan: File JSON (.data/fleetra.json).");
    console.log("✓ Data dummy siap digunakan tanpa perlu server MySQL eksternal.");
  }
}

main()
  .catch((e) => {
    console.error("Gagal inisialisasi:", e);
    process.exitCode = 1;
  })
  .finally(closeMysqlPool);
