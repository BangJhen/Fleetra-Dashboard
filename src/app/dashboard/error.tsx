"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="not-found">
      <h1>Data belum dapat ditampilkan</h1>
      <p>Terjadi kesalahan saat memuat workspace. Coba muat kembali.</p>
      <button onClick={reset}>Coba lagi</button>
    </div>
  );
}
