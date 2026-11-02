# FLEETRA Dispatcher Dashboard

Pusat kendali dan manajemen armada cerdas (Intelligent Fleet Management System) untuk operator logistik pada kompetisi ADIKARA 2026. Dashboard ini berfungsi memantau pergerakan armada secara waktu nyata, mengotomatisasi perencanaan rute ritase logistik multi-drop, memvalidasi verifikasi mitra pengemudi (Know Your Driver / KYD), memantau keselamatan berkendara berbasis telematika, serta mengelola skema kemitraan Sewa-Beli (Rent-to-Own / RTO) dan tilang elektronik (ETLE).

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

Dashboard menyediakan RESTful API berbasis Next.js App Router untuk kebutuhan konsol web internal dan sinkronisasi dengan aplikasi mobile pengemudi:

### Modul Konsol Operator Web

- POST /api/auth
  Autentikasi akun dispatcher atau manajer logistik.
  Menerima: email, password.
  Mengembalikan: token sesi, data profil operator, dan peran pengguna (manager, dispatcher, analyst).

- POST /api/register
  Registrasi akun petugas operator baru di pusat kendali depo.
  Menerima: nama lengkap, email, password, peran operasional.

- GET /api/fleet
  Mengambil seluruh snapshot data operasional secara konsolidasi.
  Mengembalikan: daftar 142 armada kendaraan, direktori mitra pengemudi, riwayat ritase, metrik keselamatan, daftar kontrak RTO, insiden ETLE, dan antrean alert telematika.

- POST /api/fleet
  Menjalankan aksi mutasi data operasional armada dan mitra. Mendukung parameter aksi:
  - allocate_driver: Memvalidasi dan memasangkan unit kendaraan siaga ke pengemudi, menetapkan skema (pool atau RTO), menghitung cicilan per ritase, dan memperbarui status akun mitra menjadi terverifikasi.
  - create_trip: Membuat jadwal penugasan ritase baru beserta urutan titik singgah pengantaran.
  - update_vehicle: Memperbarui kondisi fisik, status pemeliharaan, atau parameter telematika unit.
  - update_driver: Memperbarui data profil mitra, nomor lisensi SIM, atau status verifikasi KYD.
  - reconcile_etle: Memverifikasi dan memotong denda tilang elektronik ke saldo ritase pengemudi.

- POST /api/optimize
  Engine optimasi rute ritase berbasis algoritma Traveling Salesperson Problem (TSP) dan OSRM.
  Menerima: titik koordinat depo asal dan daftar koordinat titik singgah tujuan pengantaran.
  Mengembalikan: urutan singgah teroptimasi, jarak total (kilometer), estimasi durasi tempuh, dan garis polyline geometri rute.

- GET /api/trips/[id]/route
  Mengambil detail segmen polyline rute OSRM untuk visualisasi penugasan ritase spesifik di peta.

### Modul Sinkronisasi Aplikasi Mobile Pengemudi

- POST /api/mobile/auth
  Autentikasi akun mitra pengemudi pada aplikasi mobile.
  Menerima: email dan password pengemudi.
  Mengembalikan: ID pengemudi, token autentikasi, status verifikasi KYD, serta profil lengkap mitra.

- POST /api/mobile/register
  Pendaftaran mandiri mitra pengemudi baru dari aplikasi mobile.
  Menerima: nama, email, nomor telepon, nomor SIM, password.
  Mengembalikan: akun baru berstatus pending_verification yang otomatis tersinkronisasi ke antrean persetujuan dispatcher.

- GET /api/mobile
  Polling sinkronisasi data real-time untuk aplikasi mobile pengemudi.
  Parameter kueri: driverId.
  Mengembalikan: status verifikasi akun, unit armada yang dialokasikan, data penugasan ritase aktif, daftar titik singgah e-POD, statistik keselamatan harian, dan saldo ekuitas cicilan RTO.

- POST /api/mobile
  Menerima aksi lapangan yang dieksekusi oleh mitra pengemudi:
  - submit_epod: Mengunggah berkas foto serah terima kargo, tanda tangan digital penerima (kanvas SVG), stempel koordinat GPS, dan nama penerima paket.
  - start_trip: Mengonfirmasi inisiasi perjalanan tugas ritase aktif oleh pengemudi.
  - complete_stop: Menandai penyelesaian pengantaran pada titik singgah tertentu.
  - complete_trip: Menyelesaikan seluruh ritase pengiriman harian.
  - update_duty: Mengalihkan status kerja pengemudi antara siaga (ON) dan istirahat (OFF).
  - sos: Meneruskan sinyal darurat (insiden kecelakaan, gangguan keamanan, kerusakan mesin) beserta koordinat lokasi ke konsol dispatcher.

## Tumpukan Teknologi (Tech Stack)

- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4, komponen UI shadcn/ui berbasis Radix UI Primitives
- Peta dan Geospasial: Leaflet, React Leaflet, MapLibre GL, OpenFreeMap, Open Source Routing Machine (OSRM)
- Manajemen State: Zustand (inklusif sinkronisasi state live-tracking)
- Database: MariaDB via mysql2 dengan sinkronisasi in-memory data store
- Ikonografi: Lucide React
- Desain Antarmuka: 100% Light Mode mutlak mengacu pada panduan DESIGN.md (warna primer #2463D8, latar #FFFFFF dan #F8FAFC, tipografi Plus Jakarta Sans dan Inter)

## Panduan Menjalankan Sistem

Persyaratan:
- Node.js versi 22 atau lebih baru
- npm versi 10 atau lebih baru
- MariaDB / MySQL server aktif secara lokal

Instalasi dan Konfigurasi:

```bash
cd Fleetra-Dashboard
npm install
```

Menjalankan server pengembangan:

```bash
npm run dev
```

Aplikasi web dapat diakses pada alamat http://localhost:3000. Untuk mengakses konsol dispatcher secara langsung, tekan tombol Buka Dashboard Demo pada halaman depan, atau gunakan kredensial berikut:
- Email: manager@fleetra.demo
- Kata Sandi: Fleetra2026!

Pengujian dan Pemeriksaan Kode:

```bash
npm run typecheck
npm run test
```
