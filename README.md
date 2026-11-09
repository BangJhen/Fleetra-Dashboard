# FLEETRA — Web Dispatcher Dashboard

Pusat kendali dan manajemen armada cerdas (*Intelligent Fleet Management System*) berbasis **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, dan **MariaDB**.

---

## ⚡ Fitur Utama

- **Live Fleet Tracking**: Pemantauan *real-time* 144 unit armada di koridor logistik Jawa Barat (Leaflet & MapLibre).
- **Dynamic Multi-Drop Routing**: Optimasi urutan titik singgah pengiriman otomatis bertenaga OSRM & algoritma TSP.
- **KYD & Fleet Allocation**: Jalur verifikasi mitra pengemudi (*Know Your Driver*) dan alokasi armada *pool* atau Sewa-Beli (RTO).
- **Driver Safety & Predictive Maintenance**: Evaluasi keselamatan berkendara (skor 0–100) dan deteksi dini keausan oli/kampas rem.
- **RTO & ETLE Portal**: Buku besar cicilan sewa-beli kendaraan *pay-per-trip* serta rekonsiliasi tilang elektronik otomatis.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Opsi 1: Menggunakan Docker Compose (Direkomendasikan)
Menjalankan dashboard web dan basis data MariaDB yang langsung terisi data dummy secara otomatis:

```bash
docker compose up -d --build
```
Akses dashboard di `http://localhost:3000`.

### Opsi 2: Menjalankan Secara Lokal

```bash
# 1. Instalasi paket dependensi
npm install

# 2. Inisialisasi basis data (otomatis mendeteksi MariaDB atau mode file JSON fallback)
npm run db:init

# 3. Jalankan server pengembangan
npm run dev
```

Buka **`http://localhost:3000`** di browser.

---

## 🔑 Kredensial Masuk Demo

| Peran | Email / Identitas | Kata Sandi |
| :--- | :--- | :--- |
| **Fleet Dispatcher / Manager** | `manager@fleetra.demo` | `Fleetra2026!` *(atau klik tombol demo)* |
| **Mitra Pengemudi (API)** | `driver@fleetra.id` | `Fleetra2026!` |

---

## 🛠️ Perintah Berguna

- `npm run db:init` : Inisialisasi/replikasi basis data dari `database/fleetra_dump.sql` atau `database/seed-state.json`.
- `npm run db:dump` : Memperbarui snapshot ekspor database lokal ke file dump SQL dan JSON.
- `npm run typecheck` : Validasi statis TypeScript (`tsc --noEmit`).
- `npm run test` : Menjalankan automated test suite backend & API.

---

## 📦 Tumpukan Teknologi

`Next.js 16` • `React 19` • `TypeScript` • `Tailwind CSS v4` • `shadcn/ui` • `Leaflet / MapLibre` • `OSRM` • `MariaDB` • `Docker`
