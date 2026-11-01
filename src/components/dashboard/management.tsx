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
  DemoNote,
  Status,
  Initials,
  ExportButton,
  EmptyState,
} from "./common";
import { Icon } from "./icons";
export function Management({ kind }: { kind: "vehicles" | "drivers" }) {
  const data = useFleet((s) => s.data);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const isVehicles = kind === "vehicles";
  const vehicles = data.vehicles.filter((v) =>
    `${v.plate} ${v.model}`.toLowerCase().includes(query.toLowerCase()),
  );
  const drivers = data.drivers.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  );
  const count = isVehicles ? vehicles.length : drivers.length;
  const totalPages = Math.max(1, Math.ceil(count / 12));
  return (
    <div className="page">
      <PageHeading
        title={isVehicles ? "Data armada" : "Data pengemudi"}
        description={
          isVehicles
            ? "Satu sumber data kendaraan untuk pelacakan dan penugasan."
            : "Identitas dan ketersediaan mitra pengemudi dalam workspace."
        }
      >
        <ExportButton
          filename={isVehicles ? "fleetra-armada" : "fleetra-pengemudi"}
          rows={
            isVehicles
              ? [
                  ["Plat", "Model", "Status"],
                  ...vehicles.map((v) => [v.plate, v.model, v.status]),
                ]
              : [
                  ["Nama", "Safety score", "Perjalanan"],
                  ...drivers.map((d) => [d.name, d.score, d.trips]),
                ]
          }
        />
      </PageHeading>
      <section className="content-panel">
        <div className="table-toolbar">
          <div>
            <h2>
              {isVehicles ? "Daftar kendaraan" : "Daftar pengemudi"}
              <span className="heading-count">{count}</span>
            </h2>
            <p className="muted">Master data seed untuk prototipe MVP.</p>
          </div>
          <div className="table-search">
            <Icon name="search" />
            <Input
              aria-label={isVehicles ? "Cari kendaraan" : "Cari nama pengemudi"}
              placeholder={
                isVehicles ? "Cari plat atau model" : "Cari nama pengemudi"
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
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
              ? vehicles.slice((page - 1) * 12, page * 12).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <strong>{v.plate}</strong>
                      <small className="table-secondary">{v.model}</small>
                    </TableCell>
                    <TableCell>
                      {data.drivers.find((d) => d.id === v.driverId)?.name}
                    </TableCell>
                    <TableCell>{v.fuel}%</TableCell>
                    <TableCell>
                      <Status status={v.status} />
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost">
                        <Link href={`/dashboard/safety/vehicles/${v.id}`}>
                          Lihat kondisi
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              : drivers.slice((page - 1) * 12, page * 12).map((d) => {
                  const v = data.vehicles.find((v) => v.driverId === d.id);
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
                      <TableCell>{v?.plate || "Belum dialokasikan"}</TableCell>
                      <TableCell>{d.score} / 100</TableCell>
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
                        <Button variant="ghost" asChild>
                          <Link href={`/dashboard/safety/drivers/${d.id}`}>
                            Lihat profil
                            <Icon name="chevron" />
                          </Link>
                        </Button>
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
        <div className="table-footer">
          Halaman {page} dari {totalPages}
          <div className="inline-controls">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </section>
      <DemoNote>
        Master data saat ini bersifat baca saja. Pengelolaan data produksi
        memerlukan backend terintegrasi.
      </DemoNote>
    </div>
  );
}
