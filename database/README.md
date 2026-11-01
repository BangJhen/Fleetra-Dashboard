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

Tambahan MVP: `epod_records` menyimpan bukti per titik; `vehicle_health_snapshots` dan `driver_safety_snapshots` menyimpan histori; `etle_trip_candidates` mempertahankan semua kandidat; `sos_alerts` dan `notifications` mendukung alur darurat dan inbox. Rute OSRM disimpan sebagai JSON pada trip. Untuk prototipe, foto dan tanda tangan e-POD dapat tersimpan sebagai data URL di database; untuk produksi gunakan object storage dan simpan referensinya.

Daftar lokasi perencanaan dibaca dari tabel `locations` yang ditambahkan pada migrasi 002. Nama workspace dibaca dari `companies.name`, dan wilayah demo disimpan di `companies.address`. SOS pada alur MVP saat ini disimpan sebagai notifikasi; tabel `sos_alerts` belum digunakan sebagai sumber terpisah.

## Menjalankan di database kosong

Buat database kosong dan akun khusus melalui pengelola database, lalu pilih database tersebut saat menjalankan:

```sh
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_DATABASE < database/migrations/001_initial_mysql.sql
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_DATABASE < database/migrations/002_dashboard_mysql.sql
```

Di macOS dengan MariaDB lokal, `./scripts/setup-local-database.sh` dapat membuat database kosong, menerapkan kedua migrasi, dan menyimpan akun aplikasi berizin terbatas di `.data/fleetra-db.cnf`. Skrip tidak menimpa database atau akun yang sudah ada. Untuk database yang telah memakai migrasi 001, jalankan `./database/scripts/apply-dashboard-migration.sh` satu kali. Kedua skrip meminta autentikasi administrator melalui `sudo` dan tidak boleh dijalankan kembali pada migrasi yang telah diterapkan.

Sesudah skema siap, jalankan `npm run db:seed` satu kali. Jika `.data/fleetra.json` dan `.data/accounts.json` ada, isinya menjadi sumber data awal agar ID dan riwayat lama tetap terjaga; jika belum ada, contoh data baru dibuat. Seed berjalan dalam transaksi dan menolak database yang sudah berisi perusahaan. Simpan cadangan JSON sebelum seed dan jangan menjalankan proses aplikasi yang masih menulis JSON selama migrasi. Dashboard membaca data dari MariaDB secara default.

SQL tidak membuat database atau pengguna dan tidak menghapus tabel. Migrasi awal ini dijalankan satu kali pada database kosong; MySQL melakukan implicit commit untuk DDL, sehingga kegagalan dapat meninggalkan tabel yang sudah dibuat. Jalankan tes hanya pada database kosong yang terpisah dan boleh dibuang:

```sh
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_TEST_DATABASE < database/migrations/001_initial_mysql.sql
mysql --host=127.0.0.1 --user=FLEETRA_USER --password FLEETRA_TEST_DATABASE < database/tests/smoke.sql
```

Tes memasukkan data contoh; jangan jalankan pada database operasional. Migrasi awal dan tes smoke berhasil dijalankan pada MariaDB 11.7 lokal yang terisolasi. **Kompatibilitas dengan server MySQL 8 belum diuji**, karena server MySQL tidak tersedia di lingkungan ini.

## Aturan dan batasan

- Primary key database mengikuti ERD proposal yaitu `BIGINT`. Migrasi 002 menambahkan `external_id` untuk mempertahankan ID string dan UUID lama; foreign key tetap menggunakan ID numerik.
- Hubungan utama antar data operasional memakai foreign key komposit `company_id` dan ID untuk menolak referensi lintas perusahaan. Ini membantu integritas, tetapi isolasi akses tetap wajib ditegakkan pada setiap query dan endpoint; skema ini bukan sistem otorisasi.
- Indeks unik pada kolom generated di `trips` mencegah kendaraan atau pengemudi memperoleh dua trip aktif secara bersamaan. Pembuatan trip dan seluruh waypoint tetap harus berada dalam satu transaksi; cek status servis dan kondisi rem tetap tanggung jawab layanan aplikasi.
- Nomor plat unik secara database, tetapi normalisasi variasi spasi dan huruf tetap harus dilakukan aplikasi sebelum penyimpanan. Data arsip tetap mempertahankan identitas dan relasi historis.
- `rto_transactions` memiliki satu entri per trip. Pembatasan saldo terhadap target, kecocokan trip dengan kontrak, dan perubahan saldo harus divalidasi bersama dalam transaksi dengan penguncian baris. Nilai uang menggunakan `DECIMAL`.
- Satu ETLE dapat memiliki beberapa kandidat. Hasil kandidat bukan penetapan kesalahan; konfirmasi operator disimpan terpisah dari status pembayaran. Integrasi resmi ETLE tidak tersedia.
- Semua `DATETIME(3)` ditafsirkan sebagai UTC; aplikasi bertanggung jawab mengonversi ke WIB saat menampilkan. `nik_ktp_encrypted` hanya wadah ciphertext: enkripsi, kunci, dan kontrol akses harus disediakan layanan yang memakai kolom tersebut.
- Tabel telemetri menggunakan foreign key InnoDB dan belum dipartisi. MySQL tidak mendukung foreign key InnoDB pada tabel dengan user-defined partitioning, sehingga retensi dan partisi dalam proposal memerlukan rancangan terpisah. Referensi: [MySQL foreign key constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).
- Seed dari JSON dilakukan hanya secara eksplisit dan tidak memperbarui ulang database yang sudah berisi data. Setelah seed, file JSON adalah cadangan, bukan sumber data aktif. Pemasangan aplikasi Mobile, sensor nyata, dan deployment produksi tetap memerlukan pekerjaan lanjutan.
- Akun database aplikasi disiapkan dengan izin SELECT, INSERT, UPDATE dan DELETE. Akses skema serta migrasi tetap menggunakan akun administrator. Semua operasi dashboard menggunakan koneksi server dan query berparameter.
- Test E2E biasa menggunakan file terisolasi. Untuk menguji dengan MariaDB, gunakan database sementara yang terpisah, seed terlebih dahulu, dan set `FLEETRA_DATA_BACKEND=mysql`, `FLEETRA_DB_CONFIG`, `FLEETRA_DB_SOCKET`, dan `FLEETRA_DB_NAME`. Tes memodifikasi data dan tidak boleh diarahkan ke database operasional.
