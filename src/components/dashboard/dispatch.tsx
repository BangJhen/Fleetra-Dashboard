"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useFleet } from "./provider";
import {
  PageHeading,
  Status,
  Initials,
  EmptyState,
  time,
} from "./common";
import { Icon } from "./icons";
export function Dispatch() {
  const data = useFleet((s) => s.data);
  const params = useSearchParams();
  const [filter, setFilter] = useState(params.get("status") || "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const trips = data.trips
    .filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        `${t.code} ${data.drivers.find((d) => d.id === t.driverId)?.name} ${t.stops.map((s) => s.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .toSorted((a, b) =>
      sort === "new"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.code.localeCompare(b.code),
    );
  return (
    <div className="page">
      <PageHeading
        title="Dispatch dan trips"
        description="Rencanakan penugasan dan ikuti progres setiap pengantaran."
      >
        <Button asChild>
          <Link href="/dashboard/dispatch/new">
            <Icon name="plus" />
            Buat penugasan
          </Link>
        </Button>
      </PageHeading>
      <div className="dispatch-overview">
        {[
          ["Penugasan tercatat", data.trips.length],
          [
            "Sedang berjalan",
            data.trips.filter((t) => t.status === "in_progress").length,
          ],
          [
            "Menunggu dimulai",
            data.trips.filter((t) => t.status === "assigned").length,
          ],
          [
            "Selesai",
            data.trips.filter((t) => t.status === "completed").length,
          ],
        ].map(([l, n]) => (
          <div key={l}>
            <span>{l}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <section className="content-panel">
        <div className="table-toolbar">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {[
                ["all", "Semua"],
                ["assigned", "Ditugaskan"],
                ["in_progress", "Berjalan"],
                ["completed", "Selesai"],
                ["cancelled", "Dibatalkan"],
              ].map(([v, l]) => (
                <TabsTrigger key={v} value={v}>
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="table-search">
            <Icon name="search" />
            <Input
              aria-label="Cari penugasan"
              placeholder="Cari kode atau pengemudi"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="sort-button"
                    onClick={() =>
                      setSort((s) => (s === "new" ? "code" : "new"))
                    }
                  >
                    Penugasan
                    <Icon name="filter" />
                  </button>
                </TableHead>
                <TableHead>Pengemudi dan armada</TableHead>
                <TableHead>Progres titik</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Detail</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => {
                const driver = data.drivers.find((d) => d.id === t.driverId);
                const v = data.vehicles.find((v) => v.id === t.vehicleId);
                const done = t.stops.filter(
                  (s) => s.status === "delivered",
                ).length;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        className="table-primary-link"
                        href={`/dashboard/dispatch/${t.id}`}
                      >
                        {t.code}
                      </Link>
                      <small className="table-secondary">
                        {t.stops[0].name}
                      </small>
                      <small className="table-secondary">
                        {t.stops.length - 1} tujuan pengantaran
                      </small>
                    </TableCell>
                    <TableCell>
                      <div className="person-cell">
                        <Initials name={driver?.name || "Pengemudi"} />
                        <div>
                          <strong>{driver?.name}</strong>
                          <small>{v?.plate}</small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="table-progress">
                        <span>
                          {done} dari {t.stops.length} titik
                        </span>
                        <div>
                          <i
                            style={{
                              width: `${(done / t.stops.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{time(t.createdAt)}</TableCell>
                    <TableCell>
                      <Status status={t.status} />
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/dashboard/dispatch/${t.id}`}
                          aria-label={`Detail ${t.code}`}
                        >
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {trips.length === 0 && (
          <EmptyState
            title="Belum ada penugasan"
            description="Ubah pencarian atau buat penugasan pertama."
          />
        )}
        <div className="table-footer">
          Menampilkan {trips.length} dari {data.trips.length} penugasan
        </div>
      </section>
    </div>
  );
}
