"use client";
import Link from "next/link";
import { statusLabel, type FleetState, type SafetySnapshot } from "@/lib/types";
import { BarChart } from "./safety-charts";
import { date, time, EmptyState } from "./common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export const snapshotSource = {
  baseline: "Catatan awal simulasi",
  master: "Perubahan master simulasi",
  manual: "Pemeriksaan simulasi",
};
export function HistoryTable({
  rows,
  kind,
  overview = false,
  data,
}: {
  rows: SafetySnapshot[];
  kind: "vehicles" | "drivers";
  overview?: boolean;
  data: FleetState;
}) {
  return (
    <section className="content-panel safety-history">
      <div className="section-heading">
        <div>
          <h2>{overview ? "Pembaruan kondisi terbaru" : "Riwayat kondisi"}</h2>
          <p>
            {overview
              ? "Catatan tersimpan dari data aktif"
              : "Nilai parameter pada saat pemeriksaan dicatat"}
          </p>
        </div>
        <span className="muted">{rows.length} catatan</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu pencatatan</TableHead>
            {overview && (
              <TableHead>
                {kind === "vehicles" ? "Armada" : "Pengemudi"}
              </TableHead>
            )}
            <TableHead>
              {kind === "vehicles" ? "Indeks kondisi" : "Safety score"}
            </TableHead>
            <TableHead>
              {kind === "vehicles"
                ? "Rem dan bahan bakar"
                : "Pengereman dan kecepatan"}
            </TableHead>
            <TableHead>
              {kind === "vehicles" ? "Odometer" : "Perjalanan kumulatif"}
            </TableHead>
            <TableHead>Sumber dan catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((h) => (
            <TableRow key={h.id}>
              <TableCell>
                <strong>{date(h.at)}</strong>
                <small className="table-secondary">{time(h.at)}</small>
              </TableCell>
              {overview && (
                <TableCell>
                  <Link
                    className="table-primary-link"
                    href={`/dashboard/safety/${kind}/${h.entityId}`}
                  >
                    {kind === "vehicles"
                      ? data.vehicles.find((v) => v.id === h.entityId)?.plate
                      : data.drivers.find((d) => d.id === h.entityId)?.name}
                  </Link>
                </TableCell>
              )}
              <TableCell>
                {kind === "vehicles" ? h.values.health : h.values.score} dari
                100
              </TableCell>
              <TableCell>
                {kind === "vehicles" ? (
                  <>
                    <span>Rem {h.values.brake} persen</span>
                    <small className="table-secondary">
                      BBM {h.values.fuel} persen
                    </small>
                  </>
                ) : (
                  <>
                    <span>{h.values.braking} pengereman</span>
                    <small className="table-secondary">
                      {h.values.speeding} kecepatan
                    </small>
                  </>
                )}
              </TableCell>
              <TableCell>
                {kind === "vehicles"
                  ? `${h.values.odometer?.toLocaleString("id-ID")} km`
                  : h.values.trips}
                {kind === "vehicles" && (
                  <small className="table-secondary">
                    {h.values.status
                      ? statusLabel[h.values.status]
                      : "Status belum dicatat"}
                  </small>
                )}
              </TableCell>
              <TableCell>
                <span>{snapshotSource[h.source]}</span>
                <small className="table-secondary history-note">{h.note}</small>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!rows.length && (
        <EmptyState
          title="Belum ada riwayat"
          description="Catat pemeriksaan untuk mulai memantau perubahan kondisi."
        />
      )}
    </section>
  );
}
export function SafetyPanels({
  data,
  kind,
}: {
  data: FleetState;
  kind: "vehicles" | "drivers";
}) {
  const vehicles = data.vehicles.filter((v) => !v.archivedAt),
    drivers = data.drivers.filter((d) => !d.archivedAt);
  return (
    <div className="safety-panels">
      <div className="safety-charts-grid">
        {kind === "vehicles" ? (
          <>
            <BarChart
              compact
              title="Distribusi indeks kondisi"
              description="Jumlah kendaraan berdasarkan snapshot kondisi terkini"
              items={[
                {
                  label: "Indeks 90 sampai 100",
                  value: vehicles.filter((v) => v.health >= 90).length,
                },
                {
                  label: "Indeks 75 sampai 89",
                  value: vehicles.filter((v) => v.health >= 75 && v.health < 90)
                    .length,
                },
                {
                  label: "Indeks 60 sampai 74",
                  value: vehicles.filter((v) => v.health >= 60 && v.health < 75)
                    .length,
                },
                {
                  label: "Indeks di bawah 60",
                  value: vehicles.filter((v) => v.health < 60).length,
                },
              ]}
            />
            <BarChart
              compact
              title="Estimasi kondisi kampas rem"
              description="Persen kondisi tersisa dari input simulasi"
              items={[
                {
                  label: "Sisa 70 sampai 100 persen",
                  value: vehicles.filter((v) => v.brake >= 70).length,
                },
                {
                  label: "Sisa 30 sampai 69 persen",
                  value: vehicles.filter((v) => v.brake >= 30 && v.brake < 70)
                    .length,
                },
                {
                  label: "Sisa di bawah 30 persen",
                  value: vehicles.filter((v) => v.brake < 30).length,
                },
              ]}
            />
          </>
        ) : (
          <>
            <BarChart
              compact
              title="Distribusi skor keselamatan"
              description="Kelompok skor dari data pengemudi aktif"
              unit="pengemudi"
              items={[
                {
                  label: "Skor 90 sampai 100",
                  value: drivers.filter((d) => d.score >= 90).length,
                },
                {
                  label: "Skor 86 sampai 89",
                  value: drivers.filter((d) => d.score > 85 && d.score < 90)
                    .length,
                },
                {
                  label: "Skor 70 sampai 85",
                  value: drivers.filter((d) => d.score >= 70 && d.score <= 85)
                    .length,
                },
                {
                  label: "Skor di bawah 70",
                  value: drivers.filter((d) => d.score < 70).length,
                },
              ]}
            />
            <BarChart
              compact
              title="Rekap kejadian pengemudi"
              description="Jumlah kumulatif pada snapshot simulasi bukan jumlah harian"
              unit="kejadian"
              items={[
                {
                  label: "Pengereman keras",
                  value: drivers.reduce((n, d) => n + d.braking, 0),
                },
                {
                  label: "Melebihi kecepatan",
                  value: drivers.reduce((n, d) => n + d.speeding, 0),
                },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function RecentSafetyHistory({ data, kind }: { data: FleetState; kind: "vehicles" | "drivers" }) {
  const vehicles = data.vehicles.filter(v => !v.archivedAt);
  const drivers = data.drivers.filter(d => !d.archivedAt);
  const rows = (data.safetyHistory || [])
    .filter(
      (h) =>
        h.kind === kind &&
        (kind === "vehicles"
          ? vehicles.some((v) => v.id === h.entityId)
          : drivers.some((d) => d.id === h.entityId)),
    )
    .slice(0, 8);
  return <details className="safety-recent-history">
    <summary>Riwayat pembaruan kondisi <span>{rows.length} catatan terbaru</span></summary>
    <HistoryTable rows={rows} kind={kind} overview data={data} />
  </details>;
}
