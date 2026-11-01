"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SafetyPanels, RecentSafetyHistory } from "./safety-panels";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFleet } from "./provider";
import { PageHeading, Status, Initials, EmptyState } from "./common";
import { Icon } from "./icons";
export function Safety() {
  const params = useSearchParams();
  const stored = useFleet((s) => s.data);
  const data = {
    ...stored,
    vehicles: stored.vehicles.filter((v) => !v.archivedAt),
    drivers: stored.drivers.filter((d) => !d.archivedAt),
  };
  const [query, setQuery] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const average =
    data.vehicles.reduce((n, v) => n + v.health, 0) /
    Math.max(1, data.vehicles.length);
  const vehicles = data.vehicles.filter(
    (v) =>
      (!onlyRisk || v.status === "service") &&
      v.plate.toLowerCase().includes(query.toLowerCase()),
  );
  const drivers = data.drivers
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    .toSorted((a, b) => b.score - a.score);
  const vehiclePage = Math.min(page, Math.max(1, Math.ceil(vehicles.length / pageSize)));
  const driverPage = Math.min(page, Math.max(1, Math.ceil(drivers.length / pageSize)));
  return (
    <div className="page safety-overview-page">
      <PageHeading
        title="Health dan safety"
        description="Kondisi armada dan keselamatan pengemudi."
      />
      <Tabs
        defaultValue={params.get("tab") === "drivers" ? "drivers" : "health"}
        onValueChange={() => { setQuery(""); setPage(1); }}
      >
        <TabsList className="page-tabs">
          <TabsTrigger value="health">Kesehatan armada</TabsTrigger>
          <TabsTrigger value="drivers">Keselamatan pengemudi</TabsTrigger>
        </TabsList>
        <TabsContent value="health">
          <div className="safety-overview-summary">
            <span>Indeks kondisi armada</span>
            <strong>{average.toFixed(1)}<small>dari 100</small></strong>
            <span className="muted">{data.vehicles.length} armada aktif</span>
          </div>
          <SafetyPanels data={data} kind="vehicles" />
          <section className="content-panel safety-working-list">
            <div className="table-toolbar">
              <div>
                <h2>
                  {onlyRisk
                    ? "Prioritas pemeriksaan"
                    : "Kondisi seluruh armada"}
                </h2>
              </div>
              <div className="inline-controls">
                <Button
                  variant="outline"
                  onClick={() => { setOnlyRisk((v) => !v); setPage(1); }}
                >
                  {onlyRisk ? "Lihat semua armada" : "Hanya prioritas"}
                </Button>
                <Input
                  className="compact-input"
                  aria-label="Cari armada"
                  placeholder="Cari plat kendaraan"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Armada</TableHead>
                  <TableHead>Estimasi kampas rem</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Indeks kondisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice((vehiclePage - 1) * pageSize, vehiclePage * pageSize).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <strong>{v.plate}</strong>
                      <small className="table-secondary">{v.model}</small>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`brake-estimate ${v.brake < 30 ? "risk" : ""}`}
                      >
                        <span>{v.brake}%</span>
                        <div>
                          <i style={{ width: `${v.brake}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.odometer.toLocaleString("id-ID")} km
                    </TableCell>
                    <TableCell>{v.health} dari 100</TableCell>
                    <TableCell>
                      <Status status={v.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" asChild>
                        <Link href={`/dashboard/safety/vehicles/${v.id}`}>
                          Lihat kondisi
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {vehicles.length === 0 && (
              <EmptyState
                title="Armada tidak ditemukan"
                description="Ubah pencarian plat kendaraan."
              />
            )}
            <SafetyListPagination count={vehicles.length} page={page} pageSize={pageSize} onPage={setPage} />
          </section>
          <RecentSafetyHistory data={data} kind="vehicles" />
        </TabsContent>
        <TabsContent value="drivers">
          <div className="safety-overview-summary">
            <span>Rata rata safety score</span>
            <strong>{(data.drivers.reduce((n, d) => n + d.score, 0) / Math.max(1, data.drivers.length)).toFixed(1)}<small>dari 100</small></strong>
            <span className="muted">{data.drivers.length} pengemudi aktif</span>
          </div>
          <SafetyPanels data={data} kind="drivers" />
          <section className="content-panel safety-working-list">
            <div className="table-toolbar">
              <div>
                <h2>Peringkat keselamatan pengemudi</h2>
                <p className="muted">Diurutkan berdasarkan skor tertinggi.</p>
              </div>
              <Input
                className="compact-input"
                aria-label="Cari pengemudi"
                placeholder="Cari nama pengemudi"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Pengemudi</TableHead>
                  <TableHead>Perjalanan</TableHead>
                  <TableHead>Pengereman keras</TableHead>
                  <TableHead>Melebihi kecepatan</TableHead>
                  <TableHead>Safety score</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.slice((driverPage - 1) * pageSize, driverPage * pageSize).map((d, i) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <span className="rank">{(driverPage - 1) * pageSize + i + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div className="person-cell">
                        <Initials name={d.name} />
                        <strong>{d.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>{d.trips}</TableCell>
                    <TableCell>{d.braking} kejadian</TableCell>
                    <TableCell>{d.speeding} kejadian</TableCell>
                    <TableCell>
                      <strong className={d.score > 85 ? "good-score" : "muted"}>
                        {d.score}
                      </strong>
                      <span className="muted"> dari 100</span>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          aria-label={`Detail ${d.name}`}
                          href={`/dashboard/safety/drivers/${d.id}`}
                        >
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {drivers.length === 0 && (
              <EmptyState
                title="Pengemudi tidak ditemukan"
                description="Coba nama pengemudi lain."
              />
            )}
            <SafetyListPagination count={drivers.length} page={page} pageSize={pageSize} onPage={setPage} />
          </section>
          <RecentSafetyHistory data={data} kind="drivers" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
function SafetyListPagination({ count, page, pageSize, onPage }: {
  count: number; page: number; pageSize: number; onPage: (page: number) => void;
}) {
  if (!count) return null;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const current = Math.min(page, pages);
  return <div className="table-footer safety-list-pagination">
    <span>{(current - 1) * pageSize + 1} sampai {Math.min(current * pageSize, count)} dari {count}</span>
    <div className="inline-controls">
      <Button variant="outline" size="sm" disabled={current === 1} onClick={() => onPage(current - 1)}>Sebelumnya</Button>
      <span className="muted">Halaman {current} dari {pages}</span>
      <Button variant="outline" size="sm" disabled={current === pages} onClick={() => onPage(current + 1)}>Berikutnya</Button>
    </div>
  </div>;
}
export { SafetyDetail } from "./safety-detail";
