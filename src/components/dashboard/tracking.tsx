"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFleet } from "./provider";
import { FleetMap } from "./map-loader";
import { Icon } from "./icons";
import { Inspector } from "./inspector";
import {
  DemoNote,
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
  const data = useFleet((s) => s.data);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [gpsAt, setGpsAt] = useState(data.updatedAt);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setGpsAt(new Date().toISOString()), 5000);
    return () => clearInterval(t);
  }, [playing]);
  const vehicles = data.vehicles.filter(
    (v) =>
      (filter === "all" || v.status === filter) &&
      `${v.plate} ${data.drivers.find((d) => d.id === v.driverId)?.name}`
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
            ["Plat", "Model", "Status", "Pengemudi", "Bahan bakar"],
            ...vehicles.map((v) => [
              v.plate,
              v.model,
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
            className={cn("metric", filter === m.status && "metric-selected")}
            key={m.label}
            aria-pressed={filter === m.status}
            onClick={() => setFilter(m.status)}
          >
            <span className="metric-label">
              <i className={m.tone} />
              {m.label}
              <Icon name="arrow" />
            </span>
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
          <span className={cn("gps-dot", !playing && "paused")} />
          <span>Simulasi GPS {playing ? "aktif" : "dijeda"}</span>
          <span className="muted">{time(gpsAt)}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={
              playing ? "Jeda simulasi GPS" : "Lanjutkan simulasi GPS"
            }
            onClick={() => setPlaying((p) => !p)}
          >
            <Icon name={playing ? "pause" : "play"} />
          </Button>
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
                      <Icon name="vehicles" />
                    </span>
                    <span className="vehicle-row-info">
                      <strong>{v.plate}</strong>
                      <span>{driver?.name}</span>
                      <small>{v.location}</small>
                    </span>
                    <span className="vehicle-row-right">
                      <Status status={v.status} />
                      <small>{v.speed} km/jam</small>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="fleet-list-footer">
            <span className="status-dot" />
            Sumber data simulasi MVP
          </div>
        </div>
        <FleetMap
          vehicles={vehicles}
          selected={selected || undefined}
          onSelect={setSelected}
          playing={playing}
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
      <DemoNote>
        Data seed untuk demonstrasi. Posisi GPS bergerak setiap 5 detik selama
        simulasi aktif.
      </DemoNote>
      <Inspector id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
