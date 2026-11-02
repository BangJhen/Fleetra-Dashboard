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
import { PageHeading, Status, Initials, EmptyState, PaginationControls } from "./common";
import { Icon } from "./icons";
import { useDebouncedSearch } from "./use-debounced-search";
import { DriverAllocationModal } from "./driver-allocation-modal";
import type { Driver } from "@/lib/types";
export function Safety() {
  const params = useSearchParams();
  const stored = useFleet((s) => s.data);
  const refresh = useFleet((s) => s.refresh);
  const data = {
    ...stored,
    vehicles: stored.vehicles.filter((v) => !v.archivedAt),
    drivers: stored.drivers.filter((d) => !d.archivedAt),
  };
  const [page, setPage] = useState(1);
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const [onlyRisk, setOnlyRisk] = useState(true);
  const [driverFilter, setDriverFilter] = useState<"all" | "pending">("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [allocationDriver, setAllocationDriver] = useState<Driver | null>(null);

  const handleOpenAllocation = (d: Driver) => {
    setAllocationDriver(d);
  };

  const handleConfirmAllocation = async (payload: {
    driverId: string;
    vehicleId: string;
    scheme: "pool" | "rto";
  }) => {
    setVerifyingId(payload.driverId);
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
      setVerifyingId(null);
    }
  };

  const handleVerify = async (driverId: string, status: "approved" | "rejected") => {
    setVerifyingId(driverId);
    try {
      const res = await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "driver-verify",
          driverId,
          status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Error(err.error || "Gagal memproses verifikasi pengemudi.");
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan sistem.");
    } finally {
      setVerifyingId(null);
    }
  };

  const pageSize = 8;
  const average =
    data.vehicles.reduce((n, v) => n + v.health, 0) /
    Math.max(1, data.vehicles.length);
  const vehicles = data.vehicles.filter(
    (v) =>
      (!onlyRisk || v.status === "service") &&
      v.plate.toLowerCase().includes(search.debouncedValue.toLowerCase()),
  );
  const pendingDrivers = data.drivers.filter(
    (d) => d.verificationStatus === "pending"
  );
  const drivers = data.drivers
    .filter((d) => {
      if (driverFilter === "pending") {
        return d.verificationStatus === "pending";
      }
      return true;
    })
    .filter((d) => {
      const q = search.debouncedValue.toLowerCase().trim();
      if (!q) return true;
      const refVehicle = data.vehicles.find((v) => v.driverId === d.id && !v.archivedAt);
      const email = (d.email || `${d.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`).toLowerCase();
      const phone = (d.phone || "").toLowerCase();
      const plate = (refVehicle?.plate || "").toLowerCase();
      const model = (refVehicle?.model || "").toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        plate.includes(q) ||
        model.includes(q)
      );
    })
    .toSorted((a, b) => {
      if (a.verificationStatus === "pending" && b.verificationStatus !== "pending") return -1;
      if (b.verificationStatus === "pending" && a.verificationStatus !== "pending") return 1;
      return b.score - a.score;
    });
  const vehiclePage = Math.min(page, Math.max(1, Math.ceil(vehicles.length / pageSize)));
  const driverPage = Math.min(page, Math.max(1, Math.ceil(drivers.length / pageSize)));
  return (
    <div className="page safety-overview-page">
      <PageHeading
        title="Keselamatan armada"
        description="Kondisi armada dan keselamatan pengemudi."
      />
      <Tabs
        defaultValue={params.get("tab") === "drivers" ? "drivers" : "health"}
        onValueChange={() => { search.clear(); setPage(1); }}
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
                  value={search.value}
                  onChange={search.onChange}
                  onKeyDown={search.onKeyDown}
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
            <span className="muted">{data.drivers.length} pengemudi terdaftar</span>
          </div>

          {pendingDrivers.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm">
                    !
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-950 text-sm">
                      {pendingDrivers.length} Pengemudi Menunggu Verifikasi Dokumen & Armada (KYD)
                    </h3>
                    <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                      Pengemudi yang baru mendaftar melalui aplikasi mobile memerlukan persetujuan lisensi SIM dan armada sebelum dapat menerima tugas pengantaran logistik.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={driverFilter === "pending" ? "default" : "outline"}
                  className={
                    driverFilter === "pending"
                      ? "bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-medium text-xs"
                      : "border-amber-300 text-amber-900 bg-white hover:bg-amber-100 shrink-0 font-medium text-xs"
                  }
                  onClick={() => {
                    setDriverFilter((f) => (f === "pending" ? "all" : "pending"));
                    setPage(1);
                  }}
                >
                  {driverFilter === "pending" ? "Tampilkan Semua Driver" : `Tinjau Antrean (${pendingDrivers.length})`}
                </Button>
              </div>
            </div>
          )}

          <SafetyPanels data={data} kind="drivers" />
          <section className="content-panel safety-working-list">
            <div className="table-toolbar">
              <div>
                <h2>
                  {driverFilter === "pending"
                    ? "Antrean Verifikasi Pengemudi Baru"
                    : "Peringkat keselamatan pengemudi"}
                </h2>
                <p className="muted">
                  {driverFilter === "pending"
                    ? "Tinjau kelengkapan lisensi SIM dan armada sebelum menyetujui."
                    : "Diurutkan berdasarkan skor tertinggi."}
                </p>
              </div>
              <Input
                className="compact-input"
                aria-label="Cari pengemudi"
                placeholder="Cari nama, email, kontak, atau armada..."
                value={search.value}
                onChange={search.onChange}
                onKeyDown={search.onKeyDown}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Pengemudi</TableHead>
                  <TableHead>Armada referensi</TableHead>
                  <TableHead>Perjalanan</TableHead>
                  <TableHead>Pengereman keras</TableHead>
                  <TableHead>Melebihi kecepatan</TableHead>
                  <TableHead>Status / Skor</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.slice((driverPage - 1) * pageSize, driverPage * pageSize).map((d, i) => {
                  const refVehicle = data.vehicles.find((v) => v.driverId === d.id && !v.archivedAt);
                  const driverEmail = d.email || `${d.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`;
                  const isPending = d.verificationStatus === "pending";
                  return (
                    <TableRow key={d.id} className={isPending ? "bg-amber-50/40" : undefined}>
                      <TableCell>
                        <span className="rank">{(driverPage - 1) * pageSize + i + 1}</span>
                      </TableCell>
                      <TableCell>
                        <div className="person-cell">
                          <Initials name={d.name} />
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5">
                              <strong>{d.name}</strong>
                              {isPending && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  Menunggu Approval
                                </span>
                              )}
                            </div>
                            <small className="table-secondary">{driverEmail} {d.phone ? `· ${d.phone}` : ""}</small>
                            {d.simNumber ? (
                              <small className="text-[11px] text-slate-500 font-mono">SIM: {d.simNumber}</small>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {refVehicle ? (
                          <div className="text-left">
                            <strong>{refVehicle.plate}</strong>
                            <small className="table-secondary block">{refVehicle.model}</small>
                          </div>
                        ) : (
                          <span className="muted text-xs">Belum dialokasikan</span>
                        )}
                      </TableCell>
                      <TableCell>{d.trips}</TableCell>
                      <TableCell>{d.braking} kejadian</TableCell>
                      <TableCell>{d.speeding} kejadian</TableCell>
                      <TableCell>
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Verifikasi
                          </span>
                        ) : (
                          <>
                            <strong className={d.score > 85 ? "good-score" : "muted"}>
                              {d.score}
                            </strong>
                            <span className="muted"> dari 100</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 bg-[#2463D8] hover:bg-[#1D4ED8] text-white text-xs font-semibold gap-1"
                              onClick={() => handleOpenAllocation(d)}
                              disabled={verifyingId === d.id}
                            >
                              {verifyingId === d.id ? "..." : "✓ Alokasi & Setujui"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => handleVerify(d.id, "rejected")}
                              disabled={verifyingId === d.id}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button asChild variant="ghost" size="icon">
                            <Link
                              aria-label={`Detail ${d.name}`}
                              href={`/dashboard/safety/drivers/${d.id}`}
                            >
                              <Icon name="chevron" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {drivers.length === 0 && (
              <EmptyState
                title="Pengemudi tidak ditemukan"
                description="Coba kata kunci nama, email akun, kontak, atau armada referensi lain."
              />
            )}
            <SafetyListPagination count={drivers.length} page={page} pageSize={pageSize} onPage={setPage} />
          </section>
          <RecentSafetyHistory data={data} kind="drivers" />
        </TabsContent>
      </Tabs>

      <DriverAllocationModal
        open={!!allocationDriver}
        onOpenChange={(open) => !open && setAllocationDriver(null)}
        driver={allocationDriver}
        vehicles={data.vehicles}
        onConfirm={handleConfirmAllocation}
      />
    </div>
  );
}
function SafetyListPagination({ count, page, pageSize, onPage }: {
  count: number; page: number; pageSize: number; onPage: (page: number) => void;
}) {
  return (
    <PaginationControls
      count={count}
      page={page}
      pageSize={pageSize}
      onPage={onPage}
    />
  );
}
export { SafetyDetail } from "./safety-detail";
