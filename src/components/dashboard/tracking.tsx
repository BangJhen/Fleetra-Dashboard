"use client";
import { useState } from "react";
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
} from "./common";
import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/lib/types";
export function Tracking() {
  const stored = useFleet((s) => s.data);
  const refreshed = useFleet((s) => s.refreshed);
  const data = {
    ...stored,
    vehicles: stored.vehicles.filter((v) => !v.archivedAt),
    drivers: stored.drivers.filter((d) => !d.archivedAt),
  };
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const vehicles = data.vehicles.filter(
    (v) =>
      (filter === "all" || v.status === filter) &&
      `${v.plate} ${v.model} ${vehicleTypeLabels[vehicleType(v)]} ${data.drivers.find((d) => d.id === v.driverId)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
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
          },
          {
            label: "Sedang bergerak",
            value: moving,
            description: "Dalam perjalanan",
            tone: "success",
            status: "moving" as const,
          },
          {
            label: "Armada idle",
            value: idle,
            description: "Tidak sedang bergerak",
            tone: "warning",
            status: "idle" as const,
          },
          {
            label: "Perlu servis",
            value: service,
            description: "Periksa sebelum penugasan",
            tone: "danger",
            status: "service" as const,
          },
        ].map((m) => (
          <button
            className={cn(
              `metric metric-${m.tone}`,
              filter === m.status && "metric-selected",
            )}
            key={m.label}
            aria-pressed={filter === m.status}
            onClick={() => setFilter(m.status)}
          >
            <span className="metric-label">{m.label}</span>
            <strong>
              {m.value}
              <small>unit</small>
            </strong>
            <span className="metric-description">{m.description}</span>
          </button>
        ))}
      </div>
      <div className="tracking-toolbar">
        <div className="section-title-inline">
          <h2>Monitor armada</h2>
          <span className="muted">{vehicles.length} unit ditampilkan</span>
        </div>
        <div className="tracking-gps">
          <span>Sinkronisasi lokasi</span>
          <span className="muted">{time(refreshed)}</span>
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  aria-label="Hapus pencarian"
                  onClick={() => setQuery("")}
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
              {(["all", "moving", "idle", "service"] as const).map((s, i) => (
                <button
                  key={s}
                  aria-pressed={filter === s}
                  onClick={() => setFilter(s)}
                  className={cn(filter === s && "active")}
                >
                  {["Semua", "Bergerak", "Idle", "Servis"][i]}
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
              vehicles.map((v) => {
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
                      <span>{driver?.name}</span>
                      <small>{v.location}</small>
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
          <div>
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
          <div>
            <span>Menunggu dimulai</span>
            <strong>
              {data.trips.filter((t) => t.status === "assigned").length}
              <small>penugasan</small>
            </strong>
          </div>
          <Icon name="arrow" />
        </Link>
        <Link href="/dashboard/safety" className="summary-item">
          <div>
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
