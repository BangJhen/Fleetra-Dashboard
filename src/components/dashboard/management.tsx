"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Eye, Pencil, Archive, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFleet } from "./provider";
import {
  PageHeading,
  Status,
  Initials,
  ExportButton,
  EmptyState,
  PaginationControls,
} from "./common";
import { VehicleArt } from "./vehicle-art";
import { vehicleType, vehicleTypeLabels } from "@/lib/vehicle-types";
import { Icon } from "./icons";
import { MasterEditor, MasterArchive } from "./master-editor";
import { DriverAllocationModal } from "./driver-allocation-modal";
import { toast } from "sonner";
import type { Vehicle, Driver } from "@/lib/types";
import { useDebouncedSearch } from "./use-debounced-search";
export function Management({ kind }: { kind: "vehicles" | "drivers" }) {
  const data = useFleet((s) => s.data);
  const refresh = useFleet((s) => s.refresh);
  const [page, setPage] = useState(1);
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const isVehicles = kind === "vehicles";
  const [editor, setEditor] = useState<Vehicle | Driver | null | undefined>(
    undefined,
  );
  const [archive, setArchive] = useState<Vehicle | Driver | null>(null);
  const [allocationDriver, setAllocationDriver] = useState<Driver | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleConfirmAllocation = async (payload: {
    driverId: string;
    vehicleId: string;
    scheme: "pool" | "rto";
  }) => {
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
    toast.success("Alokasi armada dan persetujuan mitra berhasil disimpan.");
    await refresh();
  };
  const vehicles = data.vehicles.filter(
    (v) =>
      !!v.archivedAt === showArchived &&
      `${v.plate} ${v.model} ${vehicleTypeLabels[vehicleType(v)]}`.toLowerCase().includes(search.debouncedValue.toLowerCase()),
  );
  const drivers = data.drivers.filter((d) => {
    if (!!d.archivedAt !== showArchived) return false;
    const q = search.debouncedValue.toLowerCase().trim();
    if (!q) return true;
    const refVehicle = data.vehicles.find((v) => !v.archivedAt && v.driverId === d.id);
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
  });
  const count = isVehicles ? vehicles.length : drivers.length;
  const totalPages = Math.max(1, Math.ceil(count / 12));
  const currentPage = Math.min(page, totalPages);
  return (
    <div className="page management-page">
      <PageHeading
        title={isVehicles ? "Data armada" : "Data pengemudi"}
        description={
          isVehicles
            ? "Satu sumber data kendaraan untuk pelacakan dan penugasan."
            : "Identitas dan ketersediaan mitra pengemudi dalam workspace."
        }
      >
        <Button onClick={() => setEditor(null)}>
          Tambah {isVehicles ? "armada" : "pengemudi"}
        </Button>
        <ExportButton
          filename={isVehicles ? "fleetra-armada" : "fleetra-pengemudi"}
          rows={
            isVehicles
              ? [
                  ["Plat", "Model", "Jenis kendaraan", "Status"],
                  ...vehicles.map((v) => [v.plate, v.model, vehicleTypeLabels[vehicleType(v)], v.status]),
                ]
              : [
                  ["Nama", "Safety score", "Perjalanan"],
                  ...drivers.map((d) => [d.name, d.score, d.trips]),
                ]
          }
        />
      </PageHeading>
      <section className={isVehicles ? "content-panel vehicle-management-panel" : "content-panel"}>
        <div className="management-list-toolbar">
          <div className="management-list-title">
            <h2>{showArchived
              ? isVehicles ? "Arsip kendaraan" : "Arsip pengemudi"
              : isVehicles ? "Daftar kendaraan" : "Daftar pengemudi"}</h2>
            <span className="management-list-count">{count} {isVehicles ? "armada" : "pengemudi"}</span>
          </div>
          <div className="management-list-controls">
            <div className="table-search">
              <Icon name="search" />
              <Input
                aria-label={isVehicles ? "Cari kendaraan" : "Cari nama pengemudi"}
                placeholder={isVehicles ? "Cari plat atau model" : "Cari nama, email, kontak, atau armada..."}
                value={search.value}
                onChange={search.onChange}
                onKeyDown={search.onKeyDown}
              />
              {search.value && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={search.clear}
                  className="combobox-clear-btn"
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="management-archive-toggle"
              onClick={() => { setShowArchived(v => !v); setPage(1); search.clear(); }}>
              {showArchived ? "Lihat data aktif" : "Lihat arsip"}
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isVehicles ? "Kendaraan" : "Pengemudi"}</TableHead>
              <TableHead>
                {isVehicles ? "Pengemudi referensi" : "Armada & Skema"}
              </TableHead>
              <TableHead>
                {isVehicles ? "Bahan bakar" : "Safety score"}
              </TableHead>
              <TableHead>
                {isVehicles ? "Status kendaraan" : "Status & Verifikasi"}
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isVehicles
              ? vehicles
                  .slice((currentPage - 1) * 12, currentPage * 12)
                  .map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="vehicle-table-identity">
                          <VehicleArt vehicle={v} compact />
                          <div>
                            <strong>{v.plate}</strong>
                            <div className="vehicle-table-details">
                              <span>{v.model}</span>
                              <small className="vehicle-type-label">Jenis {vehicleTypeLabels[vehicleType(v)]}</small>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {data.drivers.find((d) => d.id === v.driverId)?.name}
                      </TableCell>
                      <TableCell>{v.fuel}%</TableCell>
                      <TableCell>
                        <Status status={v.status} />
                      </TableCell>
                      <TableCell>
                        <div className="master-row-actions">
                          {!v.archivedAt && (
                            <Tooltip content="Ubah">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-slate-50 cursor-pointer"
                                onClick={() => setEditor(v)}
                                aria-label="Ubah"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="sr-only">Ubah</span>
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content={v.archivedAt ? "Pulihkan" : "Arsipkan"}>
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "h-7 w-7 cursor-pointer",
                                v.archivedAt
                                   ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  : "text-slate-600 hover:text-amber-600 hover:bg-amber-50",
                              )}
                              onClick={() => setArchive(v)}
                              aria-label={v.archivedAt ? "Pulihkan" : "Arsipkan"}
                            >
                              {v.archivedAt ? (
                                <RotateCcw className="h-3.5 w-3.5" />
                              ) : (
                                <Archive className="h-3.5 w-3.5" />
                              )}
                              <span className="sr-only">
                                {v.archivedAt ? "Pulihkan" : "Arsipkan"}
                              </span>
                            </Button>
                          </Tooltip>
                          <Tooltip content="Lihat kondisi">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Link
                                href={`/dashboard/safety/vehicles/${v.id}`}
                                aria-label={`Lihat kondisi ${v.plate}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="sr-only">Lihat kondisi</span>
                              </Link>
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              : drivers
                  .slice((currentPage - 1) * 12, currentPage * 12)
                  .map((d) => {
                    const v = data.vehicles.find(
                      (v) => !v.archivedAt && v.driverId === d.id,
                    );
                    const busy = data.trips.some(
                      (t) =>
                        t.driverId === d.id &&
                        ["assigned", "in_progress"].includes(t.status),
                    );
                    const isPending = d.verificationStatus === "pending";
                    const isRejected = d.verificationStatus === "rejected";
                    const rtoContract = data.contracts?.find((c) => c.driverId === d.id);

                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="person-cell">
                            <Initials name={d.name} />
                            <div className="flex flex-col text-left">
                              <strong>{d.name}</strong>
                              <small className="table-secondary">
                                {d.email || `${d.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@fleetra.id`} {d.phone ? `· ${d.phone}` : ""}
                              </small>
                              {d.simNumber && (
                                <small className="text-[10.5px] text-slate-500 font-mono">
                                  {d.simNumber}
                                </small>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {v?.plate ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <strong>{v.plate}</strong>
                                <small className="table-secondary">({v.model})</small>
                              </div>
                              {rtoContract ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Sewa-Beli (RTO)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#2463D8] border border-blue-200">
                                  Armada Pool
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                              Belum dialokasikan
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{d.score} dari 100</TableCell>
                        <TableCell>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Menunggu Verifikasi
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Ditolak
                            </span>
                          ) : (
                            <div className="flex flex-col text-left gap-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                ✓ Terverifikasi
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {busy ? "Sedang bertugas" : "Siaga tugas"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="master-row-actions justify-end">
                            {!d.archivedAt && (
                              isPending ? (
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 bg-[#2463D8] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
                                  onClick={() => setAllocationDriver(d)}
                                >
                                  ✓ Alokasi & Setujui
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-slate-700 hover:text-slate-900 font-medium"
                                  onClick={() => setAllocationDriver(d)}
                                >
                                  Atur Armada
                                </Button>
                              )
                            )}
                            {!d.archivedAt && (
                              <Tooltip content="Ubah">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-slate-50 cursor-pointer"
                                  onClick={() => setEditor(d)}
                                  aria-label="Ubah"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span className="sr-only">Ubah</span>
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content={d.archivedAt ? "Pulihkan" : "Arsipkan"}>
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 cursor-pointer",
                                  d.archivedAt
                                    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-600 hover:text-amber-600 hover:bg-amber-50",
                                )}
                                onClick={() => setArchive(d)}
                                aria-label={d.archivedAt ? "Pulihkan" : "Arsipkan"}
                              >
                                {d.archivedAt ? (
                                  <RotateCcw className="h-3.5 w-3.5" />
                                ) : (
                                  <Archive className="h-3.5 w-3.5" />
                                )}
                                <span className="sr-only">
                                  {d.archivedAt ? "Pulihkan" : "Arsipkan"}
                                </span>
                              </Button>
                            </Tooltip>
                            <Tooltip content={`Lihat detail ${d.name}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                asChild
                              >
                                <Link href={`/dashboard/safety/drivers/${d.id}`} aria-label={`Detail ${d.name}`}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
        {count === 0 && (
          <EmptyState
            title="Data tidak ditemukan"
            description="Gunakan kata pencarian lain."
          />
        )}
        <PaginationControls
          count={count}
          page={currentPage}
          pageSize={12}
          onPage={setPage}
        />
      </section>
      {editor !== undefined && (
        <MasterEditor
          key={editor?.id || "new"}
          kind={kind}
          record={editor || undefined}
          onClose={() => {
            setEditor(undefined);
            setPage(1);
          }}
        />
      )}
      {archive && (
        <MasterArchive
          kind={kind}
          record={archive}
          onClose={() => setArchive(null)}
        />
      )}
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
