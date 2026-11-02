"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Driver, Vehicle } from "@/lib/types";
import {
  Truck,
  Car,
  Bike,
  Key,
  Check,
  Search,
  X,
  AlertCircle,
} from "lucide-react";

interface DriverAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  vehicles: Vehicle[];
  onConfirm: (payload: {
    driverId: string;
    vehicleId: string;
    scheme: "pool" | "rto";
  }) => Promise<void>;
}

export function DriverAllocationModal({
  open,
  onOpenChange,
  driver,
  vehicles,
  onConfirm,
}: DriverAllocationModalProps) {
  const [scheme, setScheme] = useState<"pool" | "rto">("pool");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter idle vehicles or vehicles already paired with this driver
  const availableVehicles = useMemo(() => {
    if (!driver) return [];
    return vehicles.filter(
      (v) =>
        !v.archivedAt &&
        (v.status === "idle" || v.driverId === driver.id || !v.driverId)
    );
  }, [vehicles, driver?.id]);

  // In RTO scheme: small vehicles & personal mobility (motorcycle, car, van, pickup)
  // In Pool scheme: all idle vehicles
  const schemeVehicles = useMemo(() => {
    return availableVehicles.filter((v) => {
      if (scheme === "rto") {
        return ["motorcycle", "car", "van", "pickup"].includes(v.type);
      }
      return true;
    });
  }, [availableVehicles, scheme]);

  // Search filter by plate, model, or type
  const searchFilteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schemeVehicles;
    return schemeVehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
    );
  }, [schemeVehicles, searchQuery]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  if (!driver) return null;

  const getVehicleIcon = (type: string) => {
    if (type === "motorcycle") return <Bike size={16} className="text-amber-600" />;
    if (type === "car") return <Car size={16} className="text-blue-600" />;
    return <Truck size={16} className="text-slate-700" />;
  };

  const getVehicleBadge = (v: Vehicle) => {
    if (scheme === "rto") {
      if (v.type === "motorcycle") return "Rp 12.000 / ritase";
      if (v.type === "car") return "Rp 35.000 / ritase";
      return "Rp 45.000 / ritase";
    }
    return "Pool Depo";
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      setErrorMsg("Pilih armada yang akan dipasangkan ke pengemudi.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onConfirm({
        driverId: driver.id,
        vehicleId: selectedVehicleId,
        scheme,
      });
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-5 space-y-4">
        {/* HEADER */}
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-slate-900">
            Persetujuan Mitra
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tentukan skema operasional dan pasangkan armada untuk driver.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. INFORMASI DRIVER (KOMPAK & BERSIH) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2463D8] font-bold flex items-center justify-center text-xs">
              {driver.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900">{driver.name}</div>
              <div className="text-[11px] text-slate-500">
                {driver.email || "driver@fleetra.id"} • {driver.simNumber || "SIM B1"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-semibold text-[11px] border border-slate-200">
              Skor {driver.score}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-[11px] border border-slate-200">
              {driver.trips || 0} trip
            </span>
          </div>
        </div>

        {/* 2. SKEMA PENUGASAN */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">Skema Penugasan</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setScheme("pool");
                setSelectedVehicleId("");
                setSearchQuery("");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                scheme === "pool"
                  ? "border-[#2463D8] bg-blue-50/40 ring-1 ring-[#2463D8]"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-xs text-slate-900 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className={scheme === "pool" ? "text-[#2463D8]" : "text-slate-500"} />
                  <span>Armada Pool</span>
                </div>
                {scheme === "pool" && <Check size={14} className="text-[#2463D8]" />}
              </div>
              <p className="text-[11px] text-slate-500">Unit operasional milik depo logistik.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setScheme("rto");
                setSelectedVehicleId("");
                setSearchQuery("");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                scheme === "rto"
                  ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-xs text-slate-900 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Key size={14} className={scheme === "rto" ? "text-emerald-600" : "text-slate-500"} />
                  <span>Sewa-Beli (RTO)</span>
                </div>
                {scheme === "rto" && <Check size={14} className="text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500">Motor, Mobil, Van via Pay-per-Trip.</p>
            </button>
          </div>

          {/* KETERANGAN SKEMA (SUBTLE, ANTI-SLOP) */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <span>
              {scheme === "rto"
                ? "RTO berlaku untuk Motor, Mobil, & Niaga Ringan."
                : "Armada pool mencakup seluruh tipe kendaraan."}
            </span>
            <span className="font-semibold text-slate-800">
              {scheme === "rto" ? "Pay-per-Trip" : "Upah Reguler"}
            </span>
          </div>
        </div>

        {/* 3. INPUT CARI & PILIH KENDARAAN (SEARCHABLE COMBOBOX) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Pilih Armada
            </label>
            <span className="text-[11px] text-slate-500">
              {schemeVehicles.length} unit siaga
            </span>
          </div>

          {/* JIKA SUDAH DIPILIH: TAMPILKAN KARTU KENDARAAN TERPILIH */}
          {selectedVehicle ? (
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-xs">
                  {getVehicleIcon(selectedVehicle.type)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{selectedVehicle.plate}</span>
                    <span className="font-normal text-slate-600">• {selectedVehicle.model}</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    {selectedVehicle.type.toUpperCase()} • {getVehicleBadge(selectedVehicle)}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800"
                onClick={() => setSelectedVehicleId("")}
              >
                Ganti
              </Button>
            </div>
          ) : (
            /* JIKA BELUM DIPILIH: TAMPILKAN SEARCH INPUT & LIST KENDARAAN */
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari plat nomor atau model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2463D8] placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* DAFTAR KENDARAAN DENGAN SCROLL HALUS */}
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                {searchFilteredVehicles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tidak ada unit yang sesuai dengan pencarian.
                  </div>
                ) : (
                  searchFilteredVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getVehicleIcon(v.type)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {v.plate} <span className="font-normal text-slate-600">• {v.model}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {v.type.toUpperCase()} • Kondisi {v.health}%
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right ml-2">
                        <span className="text-[10.5px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {getVehicleBadge(v)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-slate-600 text-xs h-9 px-4 rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="bg-[#2463D8] hover:bg-[#1D4ED8] text-white text-xs h-9 px-4 rounded-xl font-semibold shadow-sm"
            onClick={handleSubmit}
            disabled={submitting || !selectedVehicleId}
          >
            {submitting ? "Menyimpan..." : "Setujui & Pasangkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
