# Skema basis data FLEETRA

Skema awal ditujukan untuk **MySQL 8.0.16 atau lebih baru** menggunakan InnoDB dan utf8mb4. Sumber utama adalah ERD Gambar 5.6 pada `TEMPLATE_PROPOSAL_SOFTDEV.md`, dilengkapi alur MVP dalam `FLEETRA_Web_Dashboard_Sitemap_Flow_MVP.md` dan tipe data dashboard saat ini.

## Cakupan

| ERD proposal | Tabel dalam migrasi |
| --- | --- |
| Companies, Users, Drivers, Vehicles | `companies`, `users`, `drivers`, `vehicles` |
| Devices, Geofences, Telemetry logs | `devices`, `geofences`, `telemetry_logs` |
| Trips, Trip waypoints | `trips`, `trip_waypoints` |
| Maintenance records | `maintenance_records` |
| RTO contracts, RTO transactions | `rto_contracts`, `rto_transactions` |
| ETLE violations | `etle_violations` |

Tambahan MVP: `epod_records` menyimpan referensi bukti per titik; `vehicle_health_snapshots` dan `driver_safety_snapshots` menyimpan histori; `etle_trip_candidates` mempertahankan semua kandidat; `sos_alerts` dan `notifications` mendukung alur darurat dan inbox. Rute OSRM disimpan sebagai JSON pada trip. Kolom bukti menyimpan referensi berkas, bukan berkas foto atau tanda tangan itu sendiri.

## Menjalankan di database kosong

Buat database kosong dan akun khusus melalui pengelola database, lalu pilih database tersebut saat menjalankan:

```sh
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_DATABASE < database/migrations/001_initial_mysql.sql
```

SQL tidak membuat database atau pengguna dan tidak menghapus tabel. Migrasi awal ini dijalankan satu kali pada database kosong; MySQL melakukan implicit commit untuk DDL, sehingga kegagalan dapat meninggalkan tabel yang sudah dibuat. Jalankan tes hanya pada database kosong yang terpisah dan boleh dibuang:

```sh
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_TEST_DATABASE < database/migrations/001_initial_mysql.sql
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_TEST_DATABASE < database/tests/smoke.sql
```

Tes memasukkan data contoh; jangan jalankan pada database operasional. Migrasi awal dan tes smoke berhasil dijalankan pada MariaDB 11.7 lokal yang terisolasi. **Kompatibilitas dengan server MySQL 8 belum diuji**, karena server MySQL tidak tersedia di lingkungan ini.

## Aturan dan batasan

- ID mengikuti ERD proposal yaitu `BIGINT`, sedangkan data JSON MVP memakai string seperti `v1` dan UUID. Migrasi data perlu tabel pemetaan ID, bukan menyalin nilai secara langsung.
- Hubungan utama antar data operasional memakai foreign key komposit `company_id` dan ID untuk menolak referensi lintas perusahaan. Ini membantu integritas, tetapi isolasi akses tetap wajib ditegakkan pada setiap query dan endpoint; skema ini bukan sistem otorisasi.
- Indeks unik pada kolom generated di `trips` mencegah kendaraan atau pengemudi memperoleh dua trip aktif secara bersamaan. Pembuatan trip dan seluruh waypoint tetap harus berada dalam satu transaksi; cek status servis dan kondisi rem tetap tanggung jawab layanan aplikasi.
- Nomor plat unik secara database, tetapi normalisasi variasi spasi dan huruf tetap harus dilakukan aplikasi sebelum penyimpanan. Data arsip tetap mempertahankan identitas dan relasi historis.
- `rto_transactions` memiliki satu entri per trip. Pembatasan saldo terhadap target, kecocokan trip dengan kontrak, dan perubahan saldo harus divalidasi bersama dalam transaksi dengan penguncian baris. Nilai uang menggunakan `DECIMAL`.
- Satu ETLE dapat memiliki beberapa kandidat. Hasil kandidat bukan penetapan kesalahan; konfirmasi operator disimpan terpisah dari status pembayaran. Integrasi resmi ETLE tidak tersedia.
- Semua `DATETIME(3)` ditafsirkan sebagai UTC; aplikasi bertanggung jawab mengonversi ke WIB saat menampilkan. `nik_ktp_encrypted` hanya wadah ciphertext: enkripsi, kunci, dan kontrol akses harus disediakan layanan yang memakai kolom tersebut.
- Tabel telemetri menggunakan foreign key InnoDB dan belum dipartisi. MySQL tidak mendukung foreign key InnoDB pada tabel dengan user-defined partitioning, sehingga retensi dan partisi dalam proposal memerlukan rancangan terpisah. Referensi: [MySQL foreign key constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).
- Tidak ada migrasi otomatis dari JSON, koneksi aplikasi, seed, pemrosesan sensor nyata, atau konfigurasi Docker dalam perubahan ini. Dashboard masih memakai penyimpanan JSON hingga adaptor, migrasi data, dan pengujian integrasi dibuat.
