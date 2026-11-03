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
import { DriverAllocationModal } from "./driver-allocation-modal";
import {
  ShieldCheck,
  Disc,
  Fuel,
  Gauge,
  Sliders,
  Car,
  User,
  MapPin,
  Compass,
  TrendingUp,
  Clock,
  Wrench,
  AlertTriangle,
  Route,
  Activity,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SafetyDetail({
  kind,
  id,
}: {
  kind: "vehicles" | "drivers";
  id: string;
}) {
  const data = useFleet((s) => s.data);
  const refresh = useFleet((s) => s.refresh);
  const [days, setDays] = useState(30);
  const [recording, setRecording] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
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

  const handleConfirmAllocation = async (payload: {
    driverId: string;
    vehicleId: string;
    scheme: "pool" | "rto";
  }) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "driver-verify",
          driverId: payload.driverId,
          status: "approved",
          vehicleId: payload.vehicleId,
          scheme: payload.scheme,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || "Gagal memproses alokasi armada.");
      }
      await refresh();
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (status: "approved" | "rejected") => {
    if (!d) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "driver-verify",
          driverId: d.id,
          status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || "Gagal memproses verifikasi pengemudi.");
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan verifikasi.");
    } finally {
      setVerifying(false);
    }
  };
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
      {!vehicle && d && d.verificationStatus === "pending" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold text-amber-900">Menunggu Verifikasi Dokumen & Akun</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Mitra pengemudi baru mendaftar atau data SIM/armada diperbarui. Konfirmasi persetujuan agar pengemudi dapat dialokasikan rute penugasan logistik.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-[#2463D8] hover:bg-[#1D4ED8] text-white font-medium shadow-sm"
              disabled={verifying}
              onClick={() => setAllocationModalOpen(true)}
            >
              ✓ Alokasi & Setujui
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              disabled={verifying}
              onClick={() => handleVerify("rejected")}
            >
              ✕ Tolak
            </Button>
          </div>
        </div>
      )}
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
              {
                label: "Indeks kondisi",
                value: `${v!.health} dari 100`,
                icon: ShieldCheck,
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-100",
              },
              {
                label: "Estimasi kampas rem",
                value: `${v!.brake} persen`,
                icon: Disc,
                color: "text-cyan-600",
                bg: "bg-cyan-50 border-cyan-100",
              },
              {
                label: "Bahan bakar",
                value: `${v!.fuel} persen`,
                icon: Fuel,
                color: "text-indigo-600",
                bg: "bg-indigo-50 border-indigo-100",
              },
              {
                label: "Odometer",
                value: `${v!.odometer.toLocaleString("id-ID")} km`,
                icon: Gauge,
                color: "text-emerald-600",
                bg: "bg-emerald-50 border-emerald-100",
              },
            ]
          : [
              {
                label: "Skor keselamatan",
                value: `${d!.score} dari 100`,
                icon: ShieldCheck,
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-100",
              },
              {
                label: "Total perjalanan",
                value: String(d!.trips),
                icon: Route,
                color: "text-indigo-600",
                bg: "bg-indigo-50 border-indigo-100",
              },
              {
                label: "Pengereman keras",
                value: `${d!.braking} kejadian`,
                icon: AlertTriangle,
                color: "text-amber-600",
                bg: "bg-amber-50 border-amber-100",
              },
              {
                label: "Melebihi kecepatan",
                value: `${d!.speeding} kejadian`,
                icon: Gauge,
                color: "text-rose-600",
                bg: "bg-rose-50 border-rose-100",
              },
            ]
        ).map(({ label, value, icon: IconComponent, color, bg }) => (
          <div key={label} className="detail-fact-card">
            <div className="fact-header">
              <span className="fact-label">{label}</span>
              <div className={cn("fact-icon-box border", bg, color)}>
                <IconComponent className="h-4 w-4" />
              </div>
            </div>
            <strong className="fact-value">{value}</strong>
          </div>
        ))}
      </section>
      <section className="content-panel safety-technical">
        <div className="section-heading">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Wrench className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2>
                {vehicle
                  ? "Informasi teknis kendaraan"
                  : "Informasi teknis keselamatan"}
              </h2>
              <p>Parameter yang tersedia beserta sumber dan batas pembacaannya</p>
            </div>
          </div>
        </div>
        <div className="safety-technical-grid">
          <dl className="review-details">
            {(vehicle
              ? [
                  ["Identitas kendaraan", v!.plate, Car],
                  ["Model armada", v!.model, Sliders],
                  [
                    "Pengemudi referensi",
                    data.drivers.find((d) => d.id === v!.driverId)?.name ||
                      "Belum dialokasikan",
                    User,
                  ],
                  ["Kecepatan snapshot", `${v!.speed} km per jam`, Gauge],
                  ["Arah kendaraan", `${v!.heading} derajat`, Compass],
                  ["Lokasi simulasi", v!.location, MapPin],
                  ["Koordinat lintang", v!.lat.toFixed(5), MapPin],
                  ["Koordinat bujur", v!.lng.toFixed(5), MapPin],
                ]
              : [
                  ["Nama pengemudi", d!.name, User],
                  [
                    "Email akun pengemudi",
                    d!.email ||
                      (d!.id === "d1"
                        ? "driver@fleetra.id"
                        : `${d!.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`),
                    Mail,
                  ],
                  ["Kontak", d!.phone || "Belum diisi", Phone],
                  [
                    "Kendaraan referensi",
                    data.vehicles.find(
                      (v) => v.driverId === id && !v.archivedAt,
                    )?.plate || "Belum dialokasikan",
                    Car,
                  ],
                  ["Syarat skor penugasan", "Lebih dari 85", ShieldCheck],
                  ["Cakupan kejadian", "Jumlah kumulatif snapshot", Activity],
                  ["Sumber evaluasi", "Input simulasi tersimpan", FileText],
                ]
            ).map(([l, value, IconComponent]) => (
              <div key={l as string} className="review-detail-row">
                <dt className="flex items-center gap-2">
                  <IconComponent className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{l as string}</span>
                </dt>
                <dd>{value as string}</dd>
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
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2>Tren dan riwayat kondisi</h2>
            <p>Data mulai dikumpulkan sejak pencatatan diaktifkan</p>
          </div>
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
      {!vehicle && d && (
        <DriverAllocationModal
          open={allocationModalOpen}
          onOpenChange={setAllocationModalOpen}
          driver={d}
          vehicles={data.vehicles}
          onConfirm={handleConfirmAllocation}
        />
      )}
    </div>
  );
}
