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
- Leaflet dan React Leaflet, basemap vektor MapLibre dan OpenFreeMap, optimasi OSRM.
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
| Pendukung       | Master kendaraan dan pengemudi dengan tambah, ubah, arsip, pulihkan, pencarian, pagination dan CSV; notifikasi, acknowledge/resolve SOS; profil dan logout.   |

## Data dan batasan MVP

Data seed dibaca melalui API, bukan angka yang ditulis terpisah di UI. Distribusi awal kendaraan adalah 88 bergerak, 32 idle, dan 22 servis. Semua data ditandai simulasi. Pickup dihitung sebagai satu titik singgah; jumlah pengantaran ditampilkan terpisah. Skor kondisi dan safety merupakan snapshot seed, bukan diagnosis sensor.

Data disimpan di `.data/fleetra.json`, diabaikan Git, dan bertahan setelah refresh atau restart server. `FLEETRA_DATA_DIR` dapat mengubah lokasi penyimpanan. Penyimpanan lokal ini ditujukan untuk satu proses Node dengan filesystem yang persisten. Gunakan PostgreSQL/Supabase dan transaksi database sebelum menjalankan banyak instance, serverless, atau operasi produksi. Tidak ada klaim koneksi Supabase, ETLE pemerintah, bank, escrow, atau GPS fisik.

GPS simulasi berjalan di browser, tidak menulis pembacaan sensor ke database. Sinkronisasi perubahan API memakai polling setiap 15 detik dan refetch saat reconnect/focus. Peta dan OSRM memerlukan internet. Kegagalan tile tidak menutup daftar armada. Kegagalan OSRM memberi pesan dan mengizinkan rute manual; jarak dan durasi manual ditampilkan belum dihitung. Estimasi OSRM tidak mencakup kemacetan atau bongkar muat.

Aplikasi `Fleetra-Mobile` yang ada masih memakai state lokal dan tidak diubah oleh implementasi ini. Endpoint integrasi tersedia, tetapi pemasangan client API di Mobile tetap diperlukan untuk penggunaan lintas perangkat. Lihat [kontrak API Mobile](docs/mobile-api.md).

## Konfigurasi

Salin `.env.example` menjadi `.env.local` jika perlu. Tetapkan `SESSION_SECRET` acak untuk deployment. Tanpa variabel tersebut, kunci sesi lokal dibuat sekali di `.data/session-secret` dan tetap berlaku saat server dev atau proses Node dimulai ulang. Berkas ini diabaikan Git dan harus disimpan secara privat. Banyak instance harus memakai `SESSION_SECRET` yang sama melalui environment.

`MOBILE_DEMO_TOKEN` bersifat opsional dan tidak boleh memakai prefix `NEXT_PUBLIC`. Tanpa token, endpoint Mobile memberikan 503 agar tidak terbuka tanpa sengaja. Token demo mengikat satu identitas driver, ditentukan `MOBILE_DEMO_DRIVER_ID` (default `d1`), bukan role-based auth produksi. Untuk produksi, ganti akun demo serta shared token dengan autentikasi per pengguna dan izin database.

Peta default memakai data OpenStreetMap dari OpenFreeMap dengan gaya lokal `public/maps/fleetra-places.json`, diadaptasi dari Positron. Warna air dan area hijau dibuat lembut; label jalan, perisai nomor jalan, rel, dan simbol bandara disembunyikan agar nama wilayah lebih mudah dibaca. Tidak ada lapisan lalu lintas. Atribusi sumber tampil pada awal pemuatan lalu merapat setelah lima detik atau saat peta digeser, dan selalu dapat dibuka melalui kontrol Sumber peta. Prefix Leaflet dinonaktifkan. Gaya peta dapat diganti melalui `NEXT_PUBLIC_MAP_STYLE_URL`; sesuaikan atribusi di `fleet-map.tsx` jika memakai sumber lain. Basemap vektor membutuhkan WebGL dan koneksi internet; saat sumber gagal dimuat, daftar armada tetap dapat digunakan.

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

## CRUD master data

Halaman Data armada dan Data pengemudi mendukung tambah, baca, ubah, arsipkan dan pulihkan. Arsip adalah soft delete: identitas dan referensi perjalanan tetap tersimpan, sementara data dikeluarkan dari peta aktif dan kandidat penugasan. Daftar arsip dapat dibuka melalui Lihat arsip.

Validasi server menolak plat duplikat termasuk dalam arsip, nilai kondisi di luar rentang, penggantian plat dengan riwayat perjalanan, perubahan saat bertugas atau bergerak, pengarsipan data terikat RTO, serta pengarsipan pengemudi yang masih direferensikan armada aktif. Penyimpanan baru memakai kunci idempotensi. Perubahan dan pengarsipan memeriksa versi record agar tab dengan data lama tidak menimpa perubahan baru.

Penyimpanan tetap JSON lokal, belum MySQL. Menjalankan MySQL atau Docker saja tidak memindahkan data aplikasi. Migrasi memerlukan schema, transaksi, constraint, adaptor akses data dan pengujian dengan database tersebut. Lihat [catatan database](docs/database-readiness.md).

## Safety teknis dan histori kondisi

Halaman Health dan safety menampilkan distribusi indeks kendaraan, estimasi rem, distribusi skor pengemudi dan rekap kejadian kumulatif. Setiap detail kendaraan/pengemudi memuat parameter teknis, penjelasan ambang penugasan, tren, tabel riwayat dengan pagination dan ekspor CSV untuk rentang 7, 30 atau 90 hari.

Riwayat disimpan pada `safetyHistory` melalui API dan filesystem lokal yang sama. Saat data lama pertama kali dibaca, aplikasi membuat baseline pada waktu pemantauan diaktifkan. Tidak ada catatan tanggal lampau yang dibuat-buat. Perubahan parameter master dan pemeriksaan manual menambahkan snapshot baru; refresh biasa tidak menggandakan snapshot. Histori tetap mempertahankan nilai sebelumnya.

Tombol Catat pemeriksaan membuat snapshot simulasi dengan catatan tindak lanjut. Backend memvalidasi rentang, mencegah odometer dan hitungan kejadian kumulatif menurun, memeriksa versi data dan deduplikasi retry. Estimasi rem di bawah 30 persen memindahkan kendaraan ke status perlu servis; kondisi yang membaik tidak otomatis melepaskan status tersebut. Data safety bukan pembacaan sensor, diagnosis tersertifikasi atau formula prediksi berbasis ECU.

## Profil operator

Profil operator tersedia di `/dashboard/profile` melalui akun di topbar atau bagian bawah sidebar. Menu Pengaturan terpisah telah dihapus; URL lama `/dashboard/settings` mengarahkan ke Profil. Nama, email kontak dan nomor telepon dapat diedit dan disimpan melalui API dengan validasi server serta pemeriksaan versi. Nama dan inisial di sidebar/topbar mengikuti profil tersimpan.

MVP menyediakan satu akun operator demo bersama dan akun terdaftar dengan profil masing-masing. Email kontak bukan kredensial login; pengeditan profil tidak mengubah peran akses atau kata sandi. Identitas profil tetap tersimpan setelah refresh dan masuk kembali.

## Register dan login akun operator

Halaman `/register` dapat dibuka dari tautan Daftar sekarang pada Login. Form meminta nama lengkap, email, kata sandi 12 sampai 128 karakter dan konfirmasi kata sandi. Pendaftaran berhasil langsung membuat sesi dan membuka dashboard. Akun dapat digunakan untuk login ulang melalui `/login`.

Akun disimpan di `.data/accounts.json` dengan email login unik yang dinormalisasi, salt acak dan hash scrypt. Kata sandi asli tidak disimpan. Sesi ditandatangani server dan memakai cookie HttpOnly. Tetapkan SESSION_SECRET di server agar sesi tidak hilang ketika proses Node restart. File akun tetap tersedia setelah restart.

Profil terdaftar disimpan per akun. Mengubah email kontak di Profil tidak mengubah email login. Data armada dan modul operasional masih memakai workspace prototipe bersama; pendaftaran bukan pembuatan tenant baru. Akun demo masih dapat dibuka melalui Buka dashboard demo.

Belum ada verifikasi email, lupa kata sandi atau undangan organisasi. Gunakan penyimpanan database, pembatasan percobaan autentikasi, dan pengelolaan identitas yang sesuai sebelum penggunaan produksi.

Geometri OSRM ikut disimpan bersama penugasan baru dan ditampilkan pada detail perjalanan. Penugasan lama yang belum memiliki geometri dilengkapi melalui `/api/trips/[id]/route` berdasarkan urutan titik tersimpan, tanpa mengubah jarak dan durasi historis.
