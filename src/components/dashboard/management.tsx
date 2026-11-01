"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { Vehicle, Driver } from "@/lib/types";
import { useDebouncedSearch } from "./use-debounced-search";
export function Management({ kind }: { kind: "vehicles" | "drivers" }) {
  const data = useFleet((s) => s.data);
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
  const [showArchived, setShowArchived] = useState(false);
  const vehicles = data.vehicles.filter(
    (v) =>
      !!v.archivedAt === showArchived &&
      `${v.plate} ${v.model} ${vehicleTypeLabels[vehicleType(v)]}`.toLowerCase().includes(search.debouncedValue.toLowerCase()),
  );
  const drivers = data.drivers.filter(
    (d) =>
      !!d.archivedAt === showArchived &&
      d.name.toLowerCase().includes(search.debouncedValue.toLowerCase()),
  );
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
                placeholder={isVehicles ? "Cari plat atau model" : "Cari nama pengemudi"}
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
                {isVehicles ? "Pengemudi referensi" : "Armada referensi"}
              </TableHead>
              <TableHead>
                {isVehicles ? "Bahan bakar" : "Safety score"}
              </TableHead>
              <TableHead>
                {isVehicles ? "Status kendaraan" : "Ketersediaan"}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditor(v)}
                            >
                              Ubah
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setArchive(v)}
                          >
                            {v.archivedAt ? "Pulihkan" : "Arsipkan"}
                          </Button>
                          <Button asChild variant="ghost">
                            <Link href={`/dashboard/safety/vehicles/${v.id}`}>
                              Lihat kondisi
                              <Icon name="chevron" />
                            </Link>
                          </Button>
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
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="person-cell">
                            <Initials name={d.name} />
                            <strong>{d.name}</strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          {v?.plate || "Belum dialokasikan"}
                        </TableCell>
                        <TableCell>{d.score} dari 100</TableCell>
                        <TableCell>
                          <span className={busy ? "muted" : "good-score"}>
                            {busy
                              ? "Sedang bertugas"
                              : d.score > 85
                                ? "Tersedia"
                                : "Perlu evaluasi"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="master-row-actions">
                            {!d.archivedAt && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditor(d)}
                              >
                                Ubah
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchive(d)}
                            >
                              {d.archivedAt ? "Pulihkan" : "Arsipkan"}
                            </Button>
                            <Button variant="ghost" asChild>
                              <Link href={`/dashboard/safety/drivers/${d.id}`}>
                                Lihat profil
                                <Icon name="chevron" />
                              </Link>
                            </Button>
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
    </div>
  );
}
