"use client";

import React from "react";
import Link from "next/link";
import { useFleet } from "./provider";
import { Status, date, time } from "./common";
import {
  Truck,
  Route,
  Users,
  ShieldCheck,
  TrendingUp,
  Navigation,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Plus,
  Coins,
  Radio,
  Car,
  ChevronRight,
  Activity,
  CheckCircle2,
  FileText,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { vehicleType, vehicleTypeLabels } from "@/lib/vehicle-types";
import { cn } from "@/lib/utils";
export function DashboardOverview() {
  const stored = useFleet((s) => s.data);
  const refreshed = useFleet((s) => s.refreshed);
  const online = useFleet((s) => s.online);

  const data = {
    ...stored,
    vehicles: stored.vehicles.filter((v) => !v.archivedAt),
    drivers: stored.drivers.filter((d) => !d.archivedAt),
  };

  const totalVehicles = data.vehicles.length;
  const movingVehicles = data.vehicles.filter((v) => v.status === "moving").length;
  const idleVehicles = data.vehicles.filter((v) => v.status === "idle").length;
  const serviceVehicles = data.vehicles.filter((v) => v.status === "service").length;

  const activeTrips = data.trips.filter((t) => t.status === "in_progress");
  const pendingTrips = data.trips.filter((t) => t.status === "assigned");
  const unreadNotices = data.notices.filter((n) => n.status === "unread");
  const averageSafetyScore = Math.round(
    data.drivers.reduce((acc, d) => acc + d.score, 0) / Math.max(1, data.drivers.length),
  );

  return (
    <div className="page dashboard-overview-page">
      {/* ── 1. Executive Page Header ────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Pusat Kendali Operasional
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Dashboard {data.workspace.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau seluruh aktivitas armada, penugasan, kepatuhan, dan keselamatan kerja secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" asChild className="gap-2 text-xs h-9">
            <Link href="/dashboard/tracking">
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              <span>Buka Live Tracking</span>
            </Link>
          </Button>

          <Button asChild className="gap-2 text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Link href="/dashboard/dispatch/new">
              <Plus className="h-4 w-4" />
              <span>Buat Penugasan</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Top Executive KPI Cards (5 Cards) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total Armada */}
        <Link
          href="/dashboard/management/vehicles"
          className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Armada</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalVehicles} <span className="text-xs font-normal text-slate-400">unit</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              <span className="text-emerald-600 font-semibold">{movingVehicles} jalan</span> • {idleVehicles} siaga
            </div>
          </div>
        </Link>

        {/* Perjalanan Aktif */}
        <Link
          href="/dashboard/dispatch"
          className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Penugasan Aktif</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Route className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTrips.length} <span className="text-xs font-normal text-slate-400">tugas</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {pendingTrips.length} antrean menunggu
            </div>
          </div>
        </Link>

        {/* Mitra Pengemudi */}
        <Link
          href="/dashboard/management/drivers"
          className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Mitra Pengemudi</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {data.drivers.length} <span className="text-xs font-normal text-slate-400">orang</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              100% data terverifikasi
            </div>
          </div>
        </Link>

        {/* Skor Keselamatan */}
        <Link
          href="/dashboard/safety"
          className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-cyan-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Rata-rata Safety</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {averageSafetyScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Status aman & prima
            </div>
          </div>
        </Link>

        {/* Ketepatan Waktu / SLA */}
        <Link
          href="/dashboard/finance/rto"
          className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Ketepatan Waktu</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              99.4% <span className="text-xs font-normal text-slate-400">SLA</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Tepat jadwal pengantaran
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. Main Dashboard Grid (2 Columns) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Operations & Active Fleet Status (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Armada Saat Ini & Visual Breakdown */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Kondisi & Status Armada Terkini</h2>
                  <p className="text-xs text-slate-500">Distribusi operasional real-time di seluruh rute</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild className="text-xs text-blue-600 hover:text-blue-700 gap-1.5">
                <Link href="/dashboard/tracking">
                  <span>Lihat di Peta</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {/* Distribution Visual Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Distribusi Status:</span>
                <span>{totalVehicles} Total Armada</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(movingVehicles / totalVehicles) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Sedang Bergerak: ${movingVehicles} unit`}
                />
                <div
                  style={{ width: `${(idleVehicles / totalVehicles) * 100}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Siaga / Idle: ${idleVehicles} unit`}
                />
                <div
                  style={{ width: `${(serviceVehicles / totalVehicles) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Perlu Servis: ${serviceVehicles} unit`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <strong className="text-slate-900">{movingVehicles}</strong> Sedang Bergerak (62%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <strong className="text-slate-900">{idleVehicles}</strong> Siaga / Idle (23%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <strong className="text-slate-900">{serviceVehicles}</strong> Perlu Servis (15%)
                </span>
              </div>
            </div>

            {/* Mini Snapshot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Sinkronisasi GPS</span>
                <strong className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-600" />
                  {time(refreshed)} WIB
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Jangkauan Wilayah</span>
                <strong className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  {data.workspace.region}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Koneksi Server</span>
                <strong className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {online ? "Online & Stabil" : "Offline"}
                </strong>
              </div>
            </div>
          </section>

          {/* Penugasan & Perjalanan Aktif */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Penugasan Sedang Berjalan</h2>
                  <p className="text-xs text-slate-500">Daftar perjalanan kurir logistik dan pengantaran aktif</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild className="text-xs text-indigo-600 hover:text-indigo-700 gap-1.5">
                <Link href="/dashboard/dispatch">
                  <span>Lihat Semua ({data.trips.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {data.trips.slice(0, 4).map((t) => {
                const vehicleObj = data.vehicles.find((v) => v.id === t.vehicleId);
                const driverObj = data.drivers.find((d) => d.id === t.driverId);
                return (
                  <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs font-bold shrink-0">
                        {t.code.slice(-3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-semibold text-slate-900">{t.code}</strong>
                          <Status status={t.status} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {vehicleObj?.plate || "-"} • {driverObj?.name || "Tanpa pengemudi"} • {t.stops.length} titik singgah
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2.5 text-slate-600 hover:text-blue-600 self-end sm:self-auto">
                      <Link href={`/dashboard/dispatch/${t.id}`}>
                        Rincian
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Quick Shortcuts, Alerts & Compliance (1 col) */}
        <div className="space-y-6">
          {/* Akses Cepat Menu FLEETRA */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>Akses Cepat Workspace</span>
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/tracking"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Navigation className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Live Tracking</span>
              </Link>

              <Link
                href="/dashboard/dispatch/new"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Rute Baru</span>
              </Link>

              <Link
                href="/dashboard/safety"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-cyan-300 hover:bg-cyan-50/40 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Pusat Keselamatan</span>
              </Link>

              <Link
                href="/dashboard/finance/rto"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Coins className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Program Sewa-Beli</span>
              </Link>

              <Link
                href="/dashboard/finance/etle"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-purple-300 hover:bg-purple-50/40 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Cek Tilang ETLE</span>
              </Link>

              <Link
                href="/dashboard/management/vehicles"
                className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Car className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Manajemen Armada</span>
              </Link>
            </div>
          </section>

          {/* Notifikasi & Peringatan Terkini */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Notifikasi & Alert</span>
                {unreadNotices.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    {unreadNotices.length} baru
                  </span>
                )}
              </h2>
              <Link href="/dashboard/notifications" className="text-xs text-blue-600 hover:underline">
                Semua
              </Link>
            </div>

            <div className="space-y-3">
              {data.notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      n.kind === "sos"
                        ? "bg-rose-100 text-rose-600"
                        : n.kind === "health"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-600",
                    )}
                  >
                    {n.kind === "sos" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : n.kind === "health" ? (
                      <Wrench className="h-3.5 w-3.5" />
                    ) : (
                      <Route className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-semibold text-slate-900 block truncate">{n.title}</strong>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {date(n.at)} • {time(n.at)} WIB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
