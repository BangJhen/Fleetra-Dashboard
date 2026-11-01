# CRUD dan kesiapan database

Status 1 November 2026.

## Hasil verifikasi

- Master armada dan pengemudi mendukung create, read, update, soft delete dan restore lewat UI dan API.
- Pengujian browser mencakup penambahan, pengubahan, refresh, arsip, refresh arsip dan pemulihan kedua jenis master.
- Tes domain mencakup duplikat plat, rentang angka, konflik penugasan, keterikatan RTO, referensi driver dan versi record yang kedaluwarsa.
- Suite lengkap: 23 tes domain dan 12 tes browser lolos. TypeScript, ESLint dan build produksi lolos.
- Trip, e-POD, ETLE dan ledger mengikuti aksi bisnisnya sendiri. Ledger dan bukti historis tidak memiliki penghapusan bebas oleh operator.

## Kondisi aktual

Data masih disimpan pada file JSON lokal dengan antrean satu proses Node. Rancangan skema SQL tersedia di [`database/README.md`](../database/README.md), tetapi belum ada driver MySQL, migrasi data JSON, atau pengujian pada server MySQL. Akun demo terbuka tetap tersedia. Akun terdaftar mendukung login email dan kata sandi dengan hash scrypt serta profil per akun. Data armada masih berada dalam workspace prototipe bersama; konfigurasi demo harus ditinjau sebelum menyimpan data produksi atau mempublikasikan akses operasional.

## Pilihan MySQL

MySQL cocok untuk entitas relasional FLEETRA. Database hanya diakses dari server Next.js. Browser dan aplikasi Mobile mengakses API, bukan kredensial database. Migrasi yang benar memakai tabel kendaraan, driver, trip, stop, e-POD, kontrak, ledger, ETLE dan notifikasi; foreign key, plat unik, kunci idempotensi unik, version check serta transaksi untuk alokasi trip dan penyelesaian ledger.

Gunakan InnoDB dan transaksi database untuk membuat trip beserta stop serta mencegah alokasi ganda saat request bersamaan. Ledger memerlukan unique constraint pada sumber trip. Aset foto dan tanda tangan sebaiknya dipindahkan ke object storage; database menyimpan metadata dan referensinya.

Docker bersifat opsional. Untuk development tim, Docker Compose membantu menyamakan versi MySQL dan menghindari konfigurasi manual yang berbeda. Tetapkan named volume pada direktori data MySQL. Jika Next.js berjalan di host, publish port database hanya pada 127.0.0.1. Jika keduanya berada di container, gunakan network internal dan hindari publikasi port database yang tidak diperlukan.

Gunakan akun aplikasi dengan izin terbatas, secret di server, query berparameter, backup terjadwal dan uji restore. Volume persisten menjaga data saat container diganti; volume tidak menggantikan backup. Untuk deployment, gunakan database yang terkelola atau server dengan pengelolaan patch, akses jaringan dan backup yang jelas.

Referensi resmi:

- https://dev.mysql.com/doc/refman/8.4/en/security.html
- https://docs.docker.com/guides/databases/
- https://docs.docker.com/engine/network/port-publishing/
- https://docs.docker.com/engine/storage/volumes/
