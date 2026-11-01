# Kontrak integrasi Mobile demo

Endpoint ini disediakan agar Web dan Mobile dapat memakai ID penugasan serta bukti yang sama. Aplikasi Mobile yang ada belum memanggil endpoint ini. Semua data tetap bersumber `simulated`.

## Mengaktifkan

Atur `.env.local`, lalu restart Next.js:

```dotenv
SESSION_SECRET=<secret acak panjang>
MOBILE_DEMO_TOKEN=<token acak panjang>
MOBILE_DEMO_DRIVER_ID=d1
```

Setiap request Mobile memerlukan `Authorization: Bearer <token>`. Token mengikat identitas di server, sehingga driver ID dari body tidak dipercaya. Token demo ini bukan mekanisme akun produksi. Jangan memasukkannya ke Git.

Pada Expo Go fisik, base URL memakai alamat LAN komputer yang menjalankan server, misalnya `http://<IP-komputer>:3000`. Jalankan `npm run dev -- --hostname 0.0.0.0` untuk akses LAN. Jangan gunakan `localhost` di ponsel fisik.

## Mengambil tugas

`GET /api/mobile` mengembalikan `{ source, driver, trips, vehicles, contracts, ledger }` hanya untuk identitas driver yang diikat oleh token. Gunakan `trip.id` dan `stop.id` dari respons ini; jangan membuat ID trip tersendiri di Mobile. Refetch berkala atau saat layar aktif. Web refetch setiap 15 detik, juga saat tab fokus atau koneksi kembali.

## Mengirim perubahan

`POST /api/mobile`, JSON dengan field `type`, `tripId`, dan field tambahan sesuai peristiwa. Server menyimpan perubahan dan efek ledger dalam satu antrean transaksi lokal. Respons sukses `{ id }`; kegagalan `{ error }` dengan status non-2xx.

| type                    | Tambahan                                    | Validasi/hasil                                                                                                                                                            |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trip.started`          | Tidak ada                                   | `assigned` menjadi `in_progress`; retry pada trip yang berjalan tidak membuat trip baru.                                                                                  |
| `stop.arrived`          | `stopId`                                    | Trip berjalan, titik sebelumnya selesai; stop menjadi `arrived`.                                                                                                          |
| `stop.pickup_confirmed` | `stopId`                                    | Hanya pickup yang sudah didatangi; menjadi `delivered`. Pickup tidak memerlukan e-POD pengantaran.                                                                        |
| `stop.failed`           | `stopId`, `reason`                          | Hanya pengantaran yang sudah didatangi; menjadi `failed_attempt`, trip tidak selesai. Panggil `stop.arrived` untuk retry.                                                 |
| `epod.submitted`        | `stopId`, `recipient`, `photo`, `signature` | Drop-off `arrived`, nama wajib, foto dan tanda tangan wajib berupa data URL gambar PNG/JPEG/WebP base64; maksimal sekitar 900 KB per gambar, total request maksimal 3 MB. |
| `sos.sent`              | `key`, `reason` opsional                    | Penugasan aktif dan key idempotensi wajib; membuat satu notifikasi SOS, lokasi dari snapshot simulasi kendaraan.                                                          |

Contoh payload e-POD:

```json
{
  "type": "epod.submitted",
  "tripId": "<id dari API>",
  "stopId": "<id titik dari API>",
  "recipient": "Nama penerima",
  "photo": "data:image/jpeg;base64,<hasil kamera>",
  "signature": "data:image/png;base64,<hasil kanvas tanda tangan>"
}
```

Mobile hanya menampilkan sukses setelah respons server 2xx. Pertahankan `sos.key` ketika mengulang pengiriman; server mencegah duplikasi. Retry e-POD pada stop yang sudah memiliki bukti mengembalikan ID yang sama dan mempertahankan bukti pertama.

## Penyelesaian trip dan RTO

Trip selesai hanya saat semua pickup dan drop-off berstatus `delivered`. Server mencatat waktu selesai, mengubah armada menjadi idle, dan menambahkan tepat satu setoran simulasi Rp45.000 apabila kontrak kendaraan/driver cocok. Nominal dibatasi sisa kewajiban kontrak; trip yang sama tidak dapat membuat ledger ganda. Ekuitas adalah saldo awal seed ditambah ledger tercatat, dibagi nilai kontrak. Tidak ada transaksi dana.

## e-POD dan SOS di Web

Buka `/dashboard/dispatch/<trip.id>` untuk melihat bukti independen setiap stop. Foto seed tidak dibuat-buat: stop seed selesai menampilkan informasi bahwa aset bukti belum tersedia. Bukti yang dikirim endpoint tampil pada viewer.

SOS tampil di `/dashboard/notifications`; operator mengakui alert, lalu menutup kasus. Status ini tidak berarti petugas dikirim atau layanan darurat telah dihubungi.

## Sebelum produksi

Ganti JSON lokal dengan transaksi PostgreSQL, unique constraint ledger per `source_trip_id`, autentikasi driver per akun, otorisasi/RLS, object storage untuk gambar, validasi konten file, dan subscription Supabase Realtime. Token demo, data URL dan filesystem lokal dirancang untuk pengujian MVP, bukan penyimpanan produksi.
