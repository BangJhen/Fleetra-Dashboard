"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFleet } from "./provider";
import {
  BackLink,
  PageHeading,
  Status,
  EmptyState,
  ExportButton,
  date,
  time,
} from "./common";
import { historyFor } from "@/lib/safety-history";
import { TrendChart, BarChart } from "./safety-charts";
import { HistoryTable, snapshotSource } from "./safety-panels";
import { SafetyRecord } from "./safety-record";
export function SafetyDetail({
  kind,
  id,
}: {
  kind: "vehicles" | "drivers";
  id: string;
}) {
  const data = useFleet((s) => s.data);
  const [days, setDays] = useState(30);
  const [recording, setRecording] = useState(false);
  const [page, setPage] = useState(1);
  const vehicle = kind === "vehicles";
  const v = data.vehicles.find((v) => v.id === id);
  const d = data.drivers.find((d) => d.id === id);
  const record = vehicle ? v : d;
  const rows = historyFor(data, kind, id, days);
  const all = historyFor(data, kind, id, 36500);
  const latest = all.at(-1);
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pages);
  const trip = data.trips.find(
    (t) =>
      (vehicle ? t.vehicleId === id : t.driverId === id) &&
      ["assigned", "in_progress"].includes(t.status),
  );
  if (!record)
    return (
      <div className="page">
        <BackLink href="/dashboard/safety">
          Kembali ke health dan safety
        </BackLink>
        <EmptyState
          title="Data tidak ditemukan"
          description="Pilih armada atau pengemudi dari daftar yang tersedia."
        />
      </div>
    );
  const points = rows.map((h) => ({ at: h.at, ...h.values }));
  return (
    <div className="page safety-detail-page">
      <BackLink href={`/dashboard/safety${vehicle ? "" : "?tab=drivers"}`}>
        Kembali ke health dan safety
      </BackLink>
      <PageHeading
        title={vehicle ? v!.plate : d!.name}
        description={
          vehicle
            ? `${v!.model} dengan parameter kondisi simulasi`
            : "Evaluasi pengemudi berdasarkan catatan keselamatan simulasi"
        }
      >
        <Button
          onClick={() => setRecording(true)}
          disabled={!!record.archivedAt}
        >
          Catat pemeriksaan
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/management/${kind}`}>Kelola data</Link>
        </Button>
      </PageHeading>
      <div className="safety-record-summary">
        <div>
          {vehicle ? (
            <Status status={v!.status} />
          ) : (
            <span className="safety-source-tag">
              {trip
                ? "Sedang bertugas"
                : d!.score > 85
                  ? "Memenuhi skor penugasan"
                  : "Perlu evaluasi skor"}
            </span>
          )}
          <span className="muted">
            {record.archivedAt ? "Data telah diarsipkan" : "Data aktif"}
          </span>
        </div>
        <p>
          {latest
            ? `Pencatatan terakhir ${date(latest.at)} pukul ${time(latest.at)}`
            : "Belum ada catatan pemeriksaan"}
        </p>
      </div>
      <section className="detail-facts content-panel">
        {(vehicle
          ? [
              ["Indeks kondisi", `${v!.health} dari 100`],
              ["Estimasi kampas rem", `${v!.brake} persen`],
              ["Bahan bakar", `${v!.fuel} persen`],
              ["Odometer", `${v!.odometer.toLocaleString("id-ID")} km`],
            ]
          : [
              ["Skor keselamatan", `${d!.score} dari 100`],
              ["Total perjalanan", String(d!.trips)],
              ["Pengereman keras", `${d!.braking} kejadian`],
              ["Melebihi kecepatan", `${d!.speeding} kejadian`],
            ]
        ).map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="content-panel safety-technical">
        <div className="section-heading">
          <div>
            <h2>
              {vehicle
                ? "Informasi teknis kendaraan"
                : "Informasi teknis keselamatan"}
            </h2>
            <p>Parameter yang tersedia beserta sumber dan batas pembacaannya</p>
          </div>
        </div>
        <div className="safety-technical-grid">
          <dl className="review-details">
            {(vehicle
              ? [
                  ["Identitas kendaraan", v!.plate],
                  ["Model armada", v!.model],
                  [
                    "Pengemudi referensi",
                    data.drivers.find((d) => d.id === v!.driverId)?.name ||
                      "Belum dialokasikan",
                  ],
                  ["Kecepatan snapshot", `${v!.speed} km per jam`],
                  ["Arah kendaraan", `${v!.heading} derajat`],
                  ["Lokasi simulasi", v!.location],
                  ["Koordinat lintang", v!.lat.toFixed(5)],
                  ["Koordinat bujur", v!.lng.toFixed(5)],
                ]
              : [
                  ["Nama pengemudi", d!.name],
                  ["Kontak", d!.phone || "Belum diisi"],
                  [
                    "Kendaraan referensi",
                    data.vehicles.find(
                      (v) => v.driverId === id && !v.archivedAt,
                    )?.plate || "Belum dialokasikan",
                  ],
                  ["Syarat skor penugasan", "Lebih dari 85"],
                  ["Cakupan kejadian", "Jumlah kumulatif snapshot"],
                  ["Sumber evaluasi", "Input simulasi tersimpan"],
                ]
            ).map(([l, value]) => (
              <div key={l}>
                <dt>{l}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="safety-assessment">
            <h3>
              {vehicle ? "Interpretasi kondisi" : "Interpretasi evaluasi"}
            </h3>
            <p>
              {vehicle
                ? v!.brake < 30
                  ? "Estimasi rem berada di bawah ambang demo 30 persen. Jangan alokasikan armada untuk penugasan baru sebelum pemeriksaan fisik dan peninjauan status servis."
                  : v!.status === "service"
                    ? "Armada masih berstatus perlu servis. Perbaikan angka kondisi tidak otomatis menghapus status servis. Tinjau hasil pemeriksaan sebelum mengubah status operasional."
                    : "Tidak ada indikator rem di bawah ambang demo. Kondisi ini tetap memerlukan pemeriksaan rutin sebelum perjalanan."
                : d!.score > 85
                  ? "Skor memenuhi ambang kandidat penugasan. Ketersediaan akhir tetap diperiksa terhadap perjalanan aktif."
                  : "Skor belum memenuhi ambang penugasan demo. Evaluasi perilaku dan catat hasil pembinaan sebelum meninjau ulang skor."}
            </p>
            <dl className="review-details">
              <div>
                <dt>Sumber catatan terakhir</dt>
                <dd>
                  {latest ? snapshotSource[latest.source] : "Belum tersedia"}
                </dd>
              </div>
              <div>
                <dt>Catatan tersimpan</dt>
                <dd>{all.length}</dd>
              </div>
              <div>
                <dt>Sensor ECU dan CAN bus</dt>
                <dd>Belum terhubung</dd>
              </div>
              <div>
                <dt>Formula skor</dt>
                <dd>Input simulasi bukan perhitungan sensor</dd>
              </div>
            </dl>
            {trip && (
              <Link
                className="table-primary-link"
                href={`/dashboard/dispatch/${trip.id}`}
              >
                Lihat penugasan {trip.code}
              </Link>
            )}
          </div>
        </div>
      </section>
      <div className="safety-history-controls">
        <div>
          <h2>Tren dan riwayat kondisi</h2>
          <p>Data mulai dikumpulkan sejak pencatatan diaktifkan</p>
        </div>
        <div className="inline-controls">
          <label htmlFor="history-period">Rentang waktu</label>
          <select
            id="history-period"
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
          <ExportButton
            filename={`fleetra-safety-${id}`}
            rows={[
              [
                "Waktu",
                "Sumber",
                "Indeks atau skor",
                "Rem atau pengereman",
                "BBM atau kecepatan",
                "Catatan",
              ],
              ...rows.map((h) => [
                h.at,
                snapshotSource[h.source],
                h.values.health ?? h.values.score ?? "",
                h.values.brake ?? h.values.braking ?? "",
                h.values.fuel ?? h.values.speeding ?? "",
                h.note,
              ]),
            ]}
          />
        </div>
      </div>
      <div className="safety-charts-grid">
        <TrendChart
          title={vehicle ? "Tren kondisi dan rem" : "Tren skor keselamatan"}
          description="Nilai pada setiap waktu pencatatan dengan skala 0 sampai 100"
          points={points}
          series={
            vehicle
              ? [
                  { key: "health", label: "Indeks kondisi", color: "#2463D8" },
                  {
                    key: "brake",
                    label: "Estimasi rem persen",
                    color: "#819BC4",
                  },
                ]
              : [{ key: "score", label: "Skor keselamatan", color: "#2463D8" }]
          }
        />
        {vehicle ? (
          <TrendChart
            title="Riwayat bahan bakar"
            description="Persen bahan bakar pada snapshot pemeriksaan bukan konsumsi BBM"
            points={points}
            series={[
              { key: "fuel", label: "Bahan bakar persen", color: "#537FC6" },
            ]}
          />
        ) : (
          <BarChart
            title="Kejadian pada snapshot terkini"
            description="Jumlah kumulatif bukan kejadian dalam rentang waktu terpilih"
            unit="kejadian"
            items={[
              { label: "Pengereman keras", value: d!.braking },
              { label: "Melebihi kecepatan", value: d!.speeding },
            ]}
          />
        )}
      </div>
      <HistoryTable
        rows={rows.toReversed().slice((current - 1) * 10, current * 10)}
        kind={kind}
        data={data}
      />
      <div className="safety-pagination">
        <span>{rows.length} catatan pada rentang ini</span>
        <div className="inline-controls">
          <Button
            variant="outline"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Sebelumnya
          </Button>
          <span>
            Halaman {current} dari {pages}
          </span>
          <Button
            variant="outline"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
      {recording && (
        <SafetyRecord
          kind={kind}
          record={record}
          onClose={() => setRecording(false)}
        />
      )}
    </div>
  );
}
