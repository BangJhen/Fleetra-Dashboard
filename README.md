# FLEETRA Dispatcher Dashboard

MVP pusat kendali armada untuk ADIKARA 2026. Implementasi mengikuti `FLEETRA_Web_Dashboard_Sitemap_Flow_MVP.md`, `DESIGN.md`, serta `.agents/rules/fleetra_web_rules.md` di workspace induk.

## Menjalankan

Gunakan Node.js 22.13 atau lebih baru dan npm.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu pilih **Buka dashboard demo**. Login formulir juga tersedia dengan email `manager@fleetra.demo` dan kata sandi `Fleetra2026!`. Ini akun demo yang sengaja terbuka, bukan autentikasi produksi. Sesi berlaku 8 jam. Untuk menjalankan build produksi lokal:

```bash
npm run build
npm start
```

## Tech stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS v4, komponen shadcn/ui berbasis Radix.
- Leaflet dan React Leaflet, tile OpenStreetMap, optimasi OSRM.
- Zustand store per provider, server components untuk memuat data awal.
- Font Inter dan Plus Jakarta Sans dibundel lokal, tanpa ketergantungan Google Fonts saat runtime.
- Route Handler Next.js dan penyimpanan JSON atomik untuk prototipe satu proses Node.

## Modul yang tersedia

| Modul           | Perilaku                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live tracking   | 142 kendaraan seed, filter status, pencarian plat/pengemudi, heading marker, simulasi GPS 5 detik, jeda, zoom, pusatkan peta, panel telemetri dan ekspor CSV. |
| Dispatch        | Daftar dan filter trip, multi-stop, optimasi OSRM, tinjauan alokasi, validasi konflik di server, idempotency saat retry, detail dan bukti e-POD per stop.     |
| Health & safety | Indeks kondisi dari snapshot seed, daftar prioritas, blok armada servis, leaderboard dan detail pengemudi.                                                    |
| RTO             | Kontrak kemitraan, ekuitas dari saldo awal dan ledger, tautan ke sumber trip, setoran simulasi satu kali setelah seluruh stop selesai.                        |
| ETLE            | Input manual, pencocokan plat dan interval perjalanan, hasil tak cocok/tunggal/ambigu, konfirmasi internal atau sengketa.                                     |
| Pendukung       | Master kendaraan dan pengemudi baca saja dengan pencarian, pagination dan CSV; notifikasi, acknowledge/resolve SOS; profil dan logout.                        |

## Data dan batasan MVP

Data seed dibaca melalui API, bukan angka yang ditulis terpisah di UI. Distribusi awal kendaraan adalah 88 bergerak, 32 idle, dan 22 servis. Semua data ditandai simulasi. Pickup dihitung sebagai satu titik singgah; jumlah pengantaran ditampilkan terpisah. Skor kondisi dan safety merupakan snapshot seed, bukan diagnosis sensor.

Data disimpan di `.data/fleetra.json`, diabaikan Git, dan bertahan setelah refresh atau restart server. `FLEETRA_DATA_DIR` dapat mengubah lokasi penyimpanan. Penyimpanan lokal ini ditujukan untuk satu proses Node dengan filesystem yang persisten. Gunakan PostgreSQL/Supabase dan transaksi database sebelum menjalankan banyak instance, serverless, atau operasi produksi. Tidak ada klaim koneksi Supabase, ETLE pemerintah, bank, escrow, atau GPS fisik.

GPS simulasi berjalan di browser, tidak menulis pembacaan sensor ke database. Sinkronisasi perubahan API memakai polling setiap 15 detik dan refetch saat reconnect/focus. Peta dan OSRM memerlukan internet. Kegagalan tile tidak menutup daftar armada. Kegagalan OSRM memberi pesan dan mengizinkan rute manual; jarak dan durasi manual ditampilkan belum dihitung. Estimasi OSRM tidak mencakup kemacetan atau bongkar muat.

Aplikasi `Fleetra-Mobile` yang ada masih memakai state lokal dan tidak diubah oleh implementasi ini. Endpoint integrasi tersedia, tetapi pemasangan client API di Mobile tetap diperlukan untuk penggunaan lintas perangkat. Lihat [kontrak API Mobile](docs/mobile-api.md).

## Konfigurasi

Salin `.env.example` menjadi `.env.local` jika perlu. Tetapkan `SESSION_SECRET` acak untuk menjaga sesi antar restart. Tanpa variabel tersebut, secret dibuat acak di memori dan sesi perlu login ulang setelah proses berhenti.

`MOBILE_DEMO_TOKEN` bersifat opsional dan tidak boleh memakai prefix `NEXT_PUBLIC`. Tanpa token, endpoint Mobile memberikan 503 agar tidak terbuka tanpa sengaja. Token demo mengikat satu identitas driver, ditentukan `MOBILE_DEMO_DRIVER_ID` (default `d1`), bukan role-based auth produksi. Untuk produksi, ganti akun demo serta shared token dengan autentikasi per pengguna dan izin database.

Peta default memakai tile OpenStreetMap dengan atribusi yang tetap terlihat. Ikuti [kebijakan tile OSM](https://operations.osmfoundation.org/policies/tiles/) dan gunakan provider sesuai kapasitas saat produksi. URL tile dapat diganti melalui `NEXT_PUBLIC_MAP_TILE_URL`; ganti atribusi di `fleet-map.tsx` bila menggunakan provider lain.

## Verifikasi

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Tes browser menggunakan Google Chrome yang terpasang (`channel: chrome`). Jalankan `npx playwright install chrome` apabila belum tersedia, atau sesuaikan channel pada `playwright.config.ts`. Tes E2E meluncurkan server terpisah di port 3101 dan menyimpan data di `.data/qa-<timestamp>`; data workspace utama tidak dipakai. Screenshot desktop dan mobile berada di `docs/screenshots`.

Tes mencakup alokasi bentrok, idempotency publish, matching ETLE, autentikasi/origin, e-POD per stop, kegagalan pengantaran dan retry, ledger tepat sekali, SOS dan tindak lanjut operator, navigasi, persistensi refresh, dan overflow seluler.

## Struktur

- `src/app`: App Router, akses sesi, API dashboard, optimasi, dan integrasi Mobile.
- `src/components/dashboard`: shell dan modul operasional, peta dimuat dinamis di client.
- `src/components/ui`: fondasi shadcn/ui Radix.
- `src/lib`: tipe, seed, autentikasi, transaksi lokal dan aturan domain.
- `tests`: tes domain dan alur browser.
- `docs`: rencana, kontrak integrasi dan screenshot hasil verifikasi.
