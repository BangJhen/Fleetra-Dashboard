# FLEETRA Dispatcher Dashboard

Pusat kendali dan manajemen armada (Fleet Management System) cerdas untuk operator logistik pada kompetisi ADIKARA 2026. Dashboard ini berfungsi memantau pergerakan armada secara waktu nyata, mengotomatisasi perencanaan rute ritase, memvalidasi verifikasi mitra pengemudi, memantau keselamatan berkendara, serta mengelola skema kemitraan Sewa-Beli (Rent-to-Own / RTO) dan tilang elektronik (ETLE).

## Alur Kerja Sistem (Flow)

1. Verifikasi dan Alokasi Mitra (Know Your Driver):
   - Pengemudi yang mendaftar melalui aplikasi mobile masuk ke antrean verifikasi dispatcher.
   - Dispatcher meninjau kredensial (nama, kontak, nomor SIM, lisensi).
   - Dispatcher menyetujui akun dan menentukan skema operasional:
     - Armada Pool: Kendaraan operasional depo untuk semua kategori unit.
     - Sewa-Beli (RTO): Khusus motor, mobil MPV, van, dan pick-up dengan potongan ritase Pay-per-Trip.
   - Unit kendaraan idle dipasangkan langsung ke pengemudi melalui modal pencarian armada.

2. Monitoring Armada Waktu Nyata (Live Tracking):
   - Posisi armada, status operasional (bergerak, siaga, servis), bahan bakar, dan odometer dipantau pada peta interaktif.
   - Panel telemetri menampilkan rincian kondisi teknis kendaraan.

3. Perencanaan Rute dan Dispatch:
   - Dispatcher membuat penugasan multi-drop titik singgah.
   - Rute dioptimasi otomatis menggunakan OSRM untuk efisiensi jarak dan estimasi durasi tempuh.
   - Penugasan diterbitkan ke pengemudi yang memenuhi batas skor keselamatan (lebih dari 85).

4. Rekonsiliasi RTO dan ETLE:
   - Setiap ritase pengantaran yang diselesaikan dengan e-POD valid otomatis memotong saldo setoran ke ledger ekuitas RTO.
   - Pelanggaran tilang elektronik (ETLE) dicocokkan otomatis berdasarkan plat nomor dan rentang waktu kejadian perjalanan.

## Tumpukan Teknologi (Tech Stack)

- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4, komponen antarmuka shadcn/ui berbasis Radix UI
- Peta dan Rute: Leaflet, React Leaflet, MapLibre GL, OpenFreeMap, Open Source Routing Machine (OSRM)
- Manajemen State: Zustand
- Database: MariaDB via mysql2 dengan sinkronisasi in-memory store
- Tipografi: Inter dan Plus Jakarta Sans (dibundel lokal)

## Modul Utama

- Live Tracking: Peta armada koridor logistik Jawa Barat, filter status, heading marker, dan drawer telemetri.
- Dispatch Console: Perencanaan rute multi-stop, optimasi OSRM, validasi bentrok armada, dan peninjauan e-POD.
- Keselamatan dan Evaluasi: Peringkat keselamatan pengemudi, riwayat snapshot kondisi rem/odometer, dan verifikasi KYD.
- Sewa-Beli (RTO): Pengelolaan kontrak mitra, ledger setoran Pay-per-Trip, dan akumulasi ekuitas unit.
- Portal ETLE: Verifikasi tilang kamera lalu lintas dan pemotongan otomatis ke saldo perjalanan.
- Manajemen Master Data: Katalog kendaraan dan pengemudi dengan modal alokasi armada dan skema kemitraan.

## Menjalankan Aplikasi

Persyaratan: Node.js 22+ dan MariaDB lokal aktif.

```bash
npm install
npm run dev
```

Buka http://localhost:3000 pada peramban web. Pilih Buka dashboard demo atau gunakan akun `manager@fleetra.demo` dengan kata sandi `Fleetra2026!`.

Pengujian dan verifikasi tipe:

```bash
npm run typecheck
npm run test
```
