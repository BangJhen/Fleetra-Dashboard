import Link from "next/link";
export default function NotFound() {
  return (
    <div className="not-found">
      <span>404</span>
      <h1>Halaman tidak ditemukan</h1>
      <p>Periksa alamat atau kembali ke pusat kendali.</p>
      <Link href="/dashboard">Kembali ke dashboard</Link>
    </div>
  );
}
