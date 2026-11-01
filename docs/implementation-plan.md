# FLEETRA Dashboard MVP

Tanggal: 1 November 2026

## Acuan dan keputusan

Mengimplementasikan FLEETRA_Web_Dashboard_Sitemap_Flow_MVP.md, DESIGN.md, dan fleetra_web_rules.md. Prototipe lokal menggunakan Next.js App Router, React 19, TypeScript, Tailwind v4, shadcn/ui Radix, dan Leaflet. Data seed disajikan melalui API, diberi label simulasi dan disimpan secara atomik di .data. Satu akun Fleet Manager demo, bukan RBAC produksi. Aplikasi Mobile yang ada memakai state lokal; integrasi lintas perangkat dijelaskan melalui kontrak API, tanpa klaim sinkronisasi yang belum tersedia.

## Desain

Palet putih #FFFFFF, surface #F8FAFC, border #E2E8F0, teks #0F172A, muted #64748B, brand #2463D8. Status menggunakan warna semantik terbatas. Plus Jakarta Sans untuk judul, Inter untuk data. Sidebar tetap, topbar tipis, metrik berupa baris divider, peta Bandung menjadi fokus dengan daftar armada di sebelah kiri. Panel inspeksi shadcn Sheet. Tanpa emoji, gradient dekoratif, ikon berulang, dan shadow berlebihan. Aset logo resmi dipakai langsung.

## Tahapan

- [x] Fondasi dan shell navigasi responsif, autentikasi demo, API dan data seed konsisten.
- [x] Live tracking dengan heading marker, pencarian, filter, inspeksi dan GPS simulasi.
- [x] Dispatch multi-stop, optimasi OSRM dengan fallback transparan, validasi konflik, idempotency, detail trip dan e-POD per stop.
- [x] Health dan Safety, RTO ledger, ETLE pencocokan plat dan interval waktu, notifikasi SOS, master data baca dan settings.
- [x] Verifikasi typecheck, lint, build, tes domain dan browser desktop/mobile, dokumentasi operasional dan batasan integrasi.

## Risiko yang diuji

Peta jaringan gagal tetap menyediakan daftar armada. Publish ganda tidak menggandakan trip. Driver dan kendaraan servis tidak dapat dialokasikan. Hasil ETLE ambigu tidak dikonfirmasi otomatis. Semua data keuangan dan health berlabel simulasi. Refresh menjaga perubahan data. URL detail tidak valid menghasilkan not-found yang jelas. Session dan API memerlukan autentikasi, endpoint mutasi membatasi same-origin.
