"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useFleet } from "./provider";
import { FleetMap } from "./map-loader";
import { VehicleArt } from "./vehicle-art";
import { vehicleType, vehicleTypeLabels } from "@/lib/vehicle-types";
import { Icon } from "./icons";
import { Inspector } from "./inspector";
import {
  PageHeading,
  Status,
  time,
  date,
  ExportButton,
  EmptyState,
  PaginationControls,
} from "./common";
import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/lib/types";
import { useDebouncedSearch } from "./use-debounced-search";
import {
  Truck,
  Navigation,
  Clock,
  Wrench,
  Radio,
  User,
  MapPin,
  Route,
  ShieldCheck,
} from "lucide-react";
export function Tracking() {
  const stored = useFleet((s) => s.data);
  const refreshed = useFleet((s) => s.refreshed);
  const data = {
    ...stored,
    vehicles: stored.vehicles.filter((v) => !v.archivedAt),
    drivers: stored.drivers.filter((d) => !d.archivedAt),
  };
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const vehicles = data.vehicles.filter(
    (v) => {
      if (filter !== "all" && v.status !== filter) return false;
      const d = data.drivers.find((d) => d.id === v.driverId);
      const haystack = `${v.plate} ${v.model} ${vehicleTypeLabels[vehicleType(v)]} ${d?.name || ""} ${d?.email || ""} ${d?.phone || ""}`.toLowerCase();
      return haystack.includes(search.debouncedValue.toLowerCase());
    },
  );
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return vehicles.slice(start, start + pageSize);
  }, [vehicles, page, pageSize]);
  const moving = data.vehicles.filter((v) => v.status === "moving").length;
  const idle = data.vehicles.filter((v) => v.status === "idle").length;
  const service = data.vehicles.filter((v) => v.status === "service").length;
  return (
    <div className="page tracking-page">
      <PageHeading
        title="Live tracking"
        description="Pantau pergerakan armada. Tetap terhubung di setiap perjalanan."
      >
        <span className="date-label">
          <Icon name="clock" />
          {date(data.updatedAt)}
        </span>
        <ExportButton
          rows={[
            ["Plat", "Model", "Jenis kendaraan", "Status", "Pengemudi", "Bahan bakar"],
            ...vehicles.map((v) => [
              v.plate,
              v.model,
              vehicleTypeLabels[vehicleType(v)],
              v.status,
              data.drivers.find((d) => d.id === v.driverId)?.name || "",
              v.fuel,
            ]),
          ]}
        />
      </PageHeading>
      <div className="metrics-strip">
        {[
          {
            label: "Total armada",
            value: data.vehicles.length,
            description: "Terdaftar dalam workspace",
            tone: "neutral",
            status: "all" as const,
            icon: Truck,
            color: "text-blue-600",
          },
          {
            label: "Sedang bergerak",
            value: moving,
            description: "Dalam perjalanan",
            tone: "success",
            status: "moving" as const,
            icon: Navigation,
            color: "text-emerald-600",
          },
          {
            label: "Armada idle",
            value: idle,
            description: "Tidak sedang bergerak",
            tone: "warning",
            status: "idle" as const,
            icon: Clock,
            color: "text-amber-600",
          },
          {
            label: "Perlu servis",
            value: service,
            description: "Periksa sebelum penugasan",
            tone: "danger",
            status: "service" as const,
            icon: Wrench,
            color: "text-rose-600",
          },
        ].map((m) => {
          const IconComponent = m.icon;
          return (
            <button
              className={cn(
                `metric metric-${m.tone}`,
                filter === m.status && "metric-selected",
              )}
              key={m.label}
              aria-pressed={filter === m.status}
              onClick={() => {
                setFilter(m.status);
                setPage(1);
              }}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="metric-label">{m.label}</span>
                <IconComponent className={cn("h-4 w-4 shrink-0", m.color)} />
              </div>
              <strong>
                {m.value}
                <small>unit</small>
              </strong>
              <span className="metric-description">{m.description}</span>
            </button>
          );
        })}
      </div>
      <div className="tracking-toolbar">
        <div className="section-title-inline">
          <div className="flex items-center gap-2">
            <span className="live-radar-dot" aria-hidden="true" />
            <h2>Monitor armada</h2>
          </div>
          <span className="fleet-badge-pill">{vehicles.length} unit ditampilkan</span>
        </div>
        <div className="tracking-gps">
          <Radio className="h-3.5 w-3.5 text-emerald-600" />
          <span>Sinkronisasi lokasi</span>
          <span className="muted font-mono">{time(refreshed)}</span>
        </div>
      </div>
      <section className="tracking-panel" aria-label="Peta dan daftar armada">
        <div className="fleet-list-panel">
          <div className="fleet-list-top">
            <div className="search-field">
              <Icon name="search" />
              <Input
                aria-label="Cari plat atau pengemudi"
                placeholder="Cari plat atau pengemudi"
                value={search.value}
                onChange={search.onChange}
                onKeyDown={search.onKeyDown}
              />
              {search.value && (
                <button
                  aria-label="Hapus pencarian"
                  onClick={search.clear}
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
            <div
              className="fleet-status-filters"
              role="group"
              aria-label="Filter status armada"
            >
              {[
                { status: "all" as const, label: "Semua", count: data.vehicles.length },
                { status: "moving" as const, label: "Bergerak", count: moving },
                { status: "idle" as const, label: "Idle", count: idle },
                { status: "service" as const, label: "Servis", count: service },
              ].map(({ status: s, label, count }) => (
                <button
                  key={s}
                  aria-pressed={filter === s}
                  onClick={() => {
                    setFilter(s);
                    setPage(1);
                  }}
                  className={cn(filter === s && "active")}
                >
                  {label}
                  <span className="filter-count-badge" aria-hidden="true">{count}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="fleet-scroll">
            {vehicles.length === 0 ? (
              <EmptyState
                title="Armada tidak ditemukan"
                description="Coba plat lain atau ubah filter status."
              />
            ) : (
              paginatedVehicles.map((v) => {
                const driver = data.drivers.find((d) => d.id === v.driverId);
                return (
                  <button
                    className={cn(
                      "vehicle-row",
                      selected === v.id && "selected",
                    )}
                    key={v.id}
                    onClick={() => setSelected(v.id)}
                  >
                    <span className="vehicle-row-icon">
                      <VehicleArt vehicle={v} compact />
                    </span>
                    <span className="vehicle-row-info">
                      <strong>{v.plate}</strong>
                      <span className="vehicle-driver-line">
                        <User className="h-3 w-3 inline text-slate-400 mr-1 shrink-0" />
                        {driver?.name || "Tanpa pengemudi"}
                      </span>
                      <small className="vehicle-location-line">
                        <MapPin className="h-2.5 w-2.5 inline text-slate-400 mr-1 shrink-0" />
                        {v.location}
                      </small>
                    </span>
                    <span className="vehicle-row-right">
                      <Status status={v.status} />
                      <small>{v.speed} km per jam</small>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <PaginationControls
            count={vehicles.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            compact
          />
        </div>
        <FleetMap
          vehicles={vehicles}
          selected={selected || undefined}
          onSelect={setSelected}
        />
      </section>
      <div className="operations-summary">
        <div className="summary-intro">
          <h2>Operasional hari ini</h2>
          <p>Ringkasan dari penugasan yang tercatat.</p>
        </div>
        <Link href="/dashboard/dispatch" className="summary-item">
          <div className="summary-icon-box bg-blue-50 text-blue-600 border border-blue-100">
            <Route className="h-4.5 w-4.5" />
          </div>
          <div className="summary-text-wrap">
            <span>Perjalanan berjalan</span>
            <strong>
              {data.trips.filter((t) => t.status === "in_progress").length}
              <small>perjalanan</small>
            </strong>
          </div>
          <Icon name="arrow" />
        </Link>
        <Link
          href="/dashboard/dispatch?status=assigned"
          className="summary-item"
        >
          <div className="summary-icon-box bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div className="summary-text-wrap">
            <span>Menunggu dimulai</span>
            <strong>
              {data.trips.filter((t) => t.status === "assigned").length}
              <small>penugasan</small>
            </strong>
          </div>
          <Icon name="arrow" />
        </Link>
        <Link href="/dashboard/safety" className="summary-item">
          <div className="summary-icon-box bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="summary-text-wrap">
            <span>Rata-rata safety score</span>
            <strong>
              {Math.round(
                data.drivers.reduce((n, d) => n + d.score, 0) /
                  Math.max(1, data.drivers.length),
              )}
              <small>dari 100</small>
            </strong>
          </div>
          <Icon name="arrow" />
        </Link>
      </div>
      <Inspector id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
