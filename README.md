# FLEETRA Dispatcher Dashboard

Pusat kendali dan manajemen armada cerdas (Intelligent Fleet Management System) terintegrasi untuk perusahaan logistik, ekspedisi, dan operator transportasi. Dashboard ini berfungsi memantau pergerakan armada secara waktu nyata, mengotomatisasi perencanaan rute ritase logistik multi-drop, memvalidasi verifikasi mitra pengemudi (Know Your Driver / KYD), memantau keselamatan berkendara berbasis telematika, serta mengelola skema kemitraan Sewa-Beli (Rent-to-Own / RTO) dan rekonsiliasi tilang elektronik (ETLE).

## Alur Kerja Sistem (Workflow)

1. Verifikasi dan Alokasi Mitra (KYD Pipeline):
   - Pengemudi yang mendaftar melalui aplikasi mobile masuk ke antrean verifikasi dispatcher dengan status menunggu verifikasi.
   - Dispatcher meninjau kredensial pengemudi (nama, kontak, nomor lisensi SIM, serta rekam keselamatan).
   - Dispatcher menyetujui akun dan menentukan skema operasional:
     - Armada Pool: Unit operasional milik depo logistik untuk semua kategori armada (Van, Pick-up, Truk Box, Bus).
     - Sewa-Beli (RTO): Khusus armada mobilitas ringan dan dual-use (Sepeda Motor, Mobil MPV, Van, Pick-up) dengan skema cicilan Pay-per-Trip. Kendaraan komersial berat (HCV / Truk Besar) dilarang dalam RTO demi mitigasi risiko modal.
   - Unit kendaraan idle dipasangkan langsung ke pengemudi melalui modal pencarian armada interaktif.

2. Monitoring Armada Waktu Nyata (Live Fleet Tracking):
   - Seluruh armada logistik di koridor Jawa Barat dipantau posisinya pada peta interaktif.
   - Peta menampilkan arah kompas (heading marker), filter status operasional (bergerak, siaga, servis), serta riwayat pergerakan.
   - Panel drawer telematika menampilkan parameter teknis terperinci: level BBM, suhu mesin, voltase aki, tekanan ban, odometer, dan status remote engine immobilizer.

3. Perencanaan Rute dan Dispatching (Dynamic Routing):
   - Dispatcher menyusun penugasan ritase harian yang menghubungkan depo logistik dengan sejumlah titik singgah pengantaran (multi-drop).
   - Sistem mengoptimasi urutan titik singgah secara otomatis menggunakan Open Source Routing Machine (OSRM) untuk meminimalkan jarak tempuh dan konsumsi bahan bakar.
   - Penugasan dialokasikan ke pengemudi dengan Driver Safety Score memenuhi ambang batas minimum (skor di atas 85).

4. Rekonsiliasi Sewa-Beli (RTO) dan Tilang Elektronik (ETLE):
   - Setiap ritase pengantaran yang diselesaikan pengemudi dengan bukti serah terima digital (e-POD) valid otomatis memotong komisi untuk setoran ke ledger ekuitas kepemilikan unit.
   - Data pelanggaran tilang kamera kepolisian (ETLE) dicocokkan otomatis berdasarkan plat nomor kendaraan dan jendela waktu penugasan, lalu dibebankan ke saldo operasional pengemudi terkait.

## Fitur Utama

- Live Tracking & Telematics Map: Pemantauan visual armada, klasterisasi rute logistik, filter status, dan inspeksi sensor IoT per unit kendaraan.
- Dispatch Console & Route Builder: Perancangan rute multi-stop, integrasi OSRM untuk optimasi TSP (Traveling Salesperson Problem), estimasi durasi waktu tempuh, dan review dokumen e-POD.
- Driver Management & KYD Verification: Pengelolaan profil pengemudi, persetujuan pendaftaran mitra, dan penugasan armada pool atau RTO via modal alokasi berbasis pencarian.
- Driver Safety Scoring & Predictive Maintenance: Algoritma evaluasi keselamatan mengemudi (0-100) berbasis deteksi pengereman mendadak, akselerasi kasar, dan kecepatan berlebih, dilengkapi peringatan dini servis rem dan oli.
- Portal Sewa-Beli (RTO): Transparansi akumulasi ekuitas kendaraan, jadwal tenor, nilai valuasi unit, dan simulasi serah terima BPKB.
- Portal Rekonsiliasi ETLE: Deteksi pelanggaran tilang kamera lalu lintas, pengarsipan surat konfirmasi bukti tilang, dan auto-debit biaya denda.

## Spesifikasi Antarmuka Pemrograman Aplikasi (API Endpoints)

Dashboard menyediakan RESTful API berbasis Next.js App Router untuk konsol web dispatcher dan sinkronisasi dengan aplikasi mobile pengemudi:

### 1. Endpoint Konsol Web Operator

| Method | Endpoint | Deskripsi | Parameter / Payload | Respons / Output |
| --- | --- | --- | --- | --- |
| POST | /api/auth | Autentikasi sesi operator atau manajer logistik | email, password | Token sesi, profil operator, hak akses (role) |
| POST | /api/register | Pendaftaran akun operator baru di depo | nama, email, password, role | Konfirmasi registrasi dan status akun |
| GET | /api/fleet | Sinkronisasi seluruh snapshot master data operasional | - | Data 142 armada, direktori driver, ritase, alert, kontrak RTO, insiden ETLE |
| POST | /api/fleet | Mutasi data armada, pengemudi, dan penugasan | action, payload terkait | Status mutasi data dan state termutakhir |
| POST | /api/optimize | Engine optimasi rute multi-drop (TSP & OSRM) | origin (depo), stops (koordinat tujuan) | Urutan singgah optimal, total jarak (km), estimasi durasi, geometri polyline |
| GET | /api/trips/[id]/route | Detail segmen polyline rute OSRM | id (path parameter) | Koordinat polyline rute spesifik untuk visualisasi peta |

### 2. Endpoint Sinkronisasi Aplikasi Mobile Pengemudi

| Method | Endpoint | Deskripsi | Parameter / Payload | Respons / Output |
| --- | --- | --- | --- | --- |
| POST | /api/mobile/auth | Autentikasi login akun mitra pengemudi | email, password | Token sesi, driverId, status KYD, profil lengkap mitra |
| POST | /api/mobile/register | Pendaftaran mandiri mitra baru dari aplikasi mobile | nama, email, telepon, nomor SIM, password | Akun mitra baru berstatus pending_verification |
| GET | /api/mobile | Polling data real-time berkala untuk pengemudi | driverId (query parameter) | Status akun, unit armada terpasang, penugasan aktif, titik singgah, ekuitas RTO |
| POST | /api/mobile | Penerimaan aksi lapangan yang dieksekusi pengemudi | action, payload spesifik aksi | Konfirmasi pembaruan status tugas lapangan |

### 3. Rincian Aksi Lapangan Pengemudi (POST /api/mobile)

| Action | Fungsi Operasional | Parameter Kunci |
| --- | --- | --- |
| submit_epod | Mengunggah bukti serah terima paket digital | tripId, stopId, recipientName, signatureData (SVG), photoUri, latitude, longitude, completedAt |
| start_trip | Mengonfirmasi inisiasi perjalanan rute tugas aktif | tripId, startedAt |
| complete_stop | Menandai penyelesaian pengantaran di titik tertentu | tripId, stopId, status (selesai) |
| complete_trip | Menyelesaikan seluruh rangkaian tugas ritase harian | tripId, completedAt, totalDistanceKm |
| update_duty | Mengalihkan status siaga pengemudi | driverId, status (Aktif / Istirahat) |
| sos | Mengirimkan alarm insiden darurat ke konsol dispatcher | driverId, emergencyType, latitude, longitude, timestamp |

## Tumpukan Teknologi (Tech Stack)

| Kategori | Teknologi | Keterangan & Penggunaan |
| --- | --- | --- |
| Frontend Framework | Next.js 16 (App Router), React 19 | Server & Client Components dengan rendering performa tinggi |
| Bahasa Pemrograman | TypeScript 5 | Pengetikan statis ketat di seluruh modul antarmuka dan API |
| Desain & Styling | Tailwind CSS v4, shadcn/ui | Komponen UI aksesibel berbasis Radix UI Primitives (100% Light Mode) |
| Peta & Geospasial | Leaflet, React Leaflet, MapLibre GL | Visualisasi interaktif armada logistik Jawa Barat dan heading marker |
| Routing Engine | OSRM, OpenFreeMap | Algoritma optimasi Traveling Salesperson Problem (TSP) multi-drop |
| Manajemen State | Zustand | State management reaktif untuk data live tracking dan filter armada |
| Basis Data | MariaDB via mysql2 | Penyimpanan data relasional dengan sinkronisasi in-memory store |
| Ikonografi | Lucide React | Ikon visual konsisten, modern, dan ringan |
| Tipografi | Plus Jakarta Sans & Inter | Font enterprise berlisensi open-source dibundel secara lokal |

## Panduan Menjalankan Sistem

Persyaratan:
- Node.js versi 22 atau lebih baru
- npm versi 10 atau lebih baru
- MariaDB / MySQL server aktif secara lokal

Instalasi Dependensi:

```bash
cd Fleetra-Dashboard
npm install
```

Menjalankan Server Pengembangan:

```bash
npm run dev
```

Aplikasi web dapat diakses melalui peramban pada alamat http://localhost:3000. Untuk mengakses konsol dispatcher secara langsung, tekan tombol Buka Dashboard Demo pada halaman depan, atau gunakan kredensial berikut:
- Email: manager@fleetra.demo
- Kata Sandi: Fleetra2026!

### Manajemen Basis Data & Seed Dummy

Untuk memastikan sistem dapat langsung dijalankan di mesin lain tanpa kehilangan data:

1. **Inisialisasi Database Otomatis:**
   ```bash
   npm run db:init
   ```
   Skrip ini secara cerdas mendeteksi:
   - Jika MariaDB/MySQL aktif: Mengimpor skema (`database/fleetra_dump.sql`) dan seluruh data 144 armada, 144 driver, 158 trip, 20 lokasi, serta akun pengguna.
   - Jika MySQL tidak aktif / mode file: Menginisialisasi `.data/fleetra.json` dari `database/seed-state.json`.

2. **Ekspor Cadangan Terkini (Dump):**
   ```bash
   npm run db:dump
   ```
   Memperbarui `database/fleetra_dump.sql` dan `database/seed-state.json` dengan data operasional termutakhir dari database lokal.

### Menjalankan dengan Docker Container (Cross-Platform)

Sistem FLEETRA Dashboard telah ter-kontainerisasi penuh dengan dukungan database MariaDB otomatis:

1. **Menjalankan via Docker Compose:**
```bash
docker compose up -d --build
```
Docker Compose akan secara otomatis menjalankan kontainer database MariaDB (`fleetra-db`), mengimpor skema & dummy seed dari `database/fleetra_dump.sql`, dan menyalakan `fleetra-dashboard` di `http://localhost:3000`.

2. **Melihat status kontainer:**
```bash
docker compose ps
docker compose logs -f dashboard
```

3. **Menghentikan kontainer:**
```bash
docker compose down
```

Pengujian dan Pemeriksaan Kode:

```bash
npm run typecheck
npm run test
```
