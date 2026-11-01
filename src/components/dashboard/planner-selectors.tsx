"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Icon } from "./icons";
import { Button } from "@/components/ui/button";
import type { Driver, Vehicle } from "@/lib/types";
import { useDebouncedSearch } from "./use-debounced-search";
import { PaginationControls } from "./common";

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

function getLocationTag(name: string): string {
  const lower = name.toLowerCase();
  if (lower.startsWith("gudang")) return "Gudang";
  if (lower.startsWith("hub")) return "Hub";
  if (lower.startsWith("sentra")) return "Sentra";
  if (lower.startsWith("depo")) return "Depo";
  if (lower.startsWith("ritel") || lower.startsWith("toko")) return "Ritel";
  if (lower.startsWith("terminal")) return "Terminal";
  if (lower.startsWith("mitra")) return "Mitra";
  return "Outlet";
}

export function LocationSearchSelect({
  id,
  value,
  locations,
  selectedIndices,
  onChange,
  onRemove,
  stopNumber,
  isOrigin,
}: {
  id: string;
  value: number;
  locations: Location[];
  selectedIndices: number[];
  onChange: (nextIndex: number) => void;
  onRemove?: () => void;
  stopNumber: number;
  isOrigin?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLocation = locations[value] || locations[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredLocations = useMemo(() => {
    if (!search.debouncedValue.trim()) return locations.map((loc, idx) => ({ ...loc, originalIndex: idx }));
    const q = search.debouncedValue.toLowerCase();
    return locations
      .map((loc, idx) => ({ ...loc, originalIndex: idx }))
      .filter((loc) => loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q));
  }, [locations, search.debouncedValue]);

  const paginatedLocations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLocations.slice(start, start + pageSize);
  }, [filteredLocations, page, pageSize]);

  return (
    <div className="stop-field" ref={containerRef}>
      <span className={`stop-index ${isOrigin ? "origin" : ""}`}>{stopNumber}</span>
      <div className="form-field">
        <label htmlFor={id} className="text-xs font-medium text-slate-700">
          {isOrigin ? "Gudang asal" : `Tujuan ${stopNumber - 1}`}
        </label>
        {/* Accessible hidden select for standard form & automated e2e compatibility */}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {locations.map((l, j) => (
            <option
              key={j}
              value={j}
              disabled={selectedIndices.includes(j) && j !== value}
            >
              {l.name}
            </option>
          ))}
        </select>
        <div className="relative">
          <button
            type="button"
            className={`searchable-combobox-trigger ${isOpen ? "ring-2 ring-primary/20 border-primary" : ""}`}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <div className="combobox-trigger-content">
              <span className="combobox-title">{currentLocation?.name || "Pilih lokasi"}</span>
              <span className="combobox-subtitle">{currentLocation?.address || ""}</span>
            </div>
            <div className="combobox-trigger-actions">
              <span className="location-type-pill">{getLocationTag(currentLocation?.name || "")}</span>
              <span className="combobox-chevron"><Icon name="search" /></span>
            </div>
          </button>

          {isOpen && (
            <div className="searchable-combobox-popover" role="listbox">
              <div className="combobox-search-header">
                <Icon name="search" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari nama lokasi atau alamat jalan..."
                  value={search.value}
                  onChange={search.onChange}
                  onKeyDown={search.onKeyDown}
                  className="combobox-search-input"
                />
                {search.value && (
                  <button
                    type="button"
                    onClick={search.clear}
                    className="combobox-clear-btn"
                    aria-label="Bersihkan pencarian"
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>
              <div className="combobox-scroll-list">
                {filteredLocations.length === 0 ? (
                  <div className="combobox-empty-message">
                    Tidak ada lokasi yang cocok dengan &quot;{search.debouncedValue}&quot;
                  </div>
                ) : (
                  paginatedLocations.map((loc) => {
                    const isAlreadySelected = selectedIndices.includes(loc.originalIndex) && loc.originalIndex !== value;
                    const isCurrent = loc.originalIndex === value;
                    return (
                      <button
                        key={loc.originalIndex}
                        type="button"
                        disabled={isAlreadySelected}
                        className={`combobox-item ${isCurrent ? "current" : ""} ${isAlreadySelected ? "disabled" : ""}`}
                        onClick={() => {
                          onChange(loc.originalIndex);
                          setIsOpen(false);
                          search.clear();
                        }}
                      >
                        <div className="combobox-item-info">
                          <div className="combobox-item-row">
                            <strong className="combobox-item-name">{loc.name}</strong>
                            <span className="location-type-tag">{getLocationTag(loc.name)}</span>
                          </div>
                          <span className="combobox-item-address">{loc.address}</span>
                        </div>
                        {isCurrent && (
                          <span className="combobox-check-mark"><Icon name="check" /></span>
                        )}
                        {isAlreadySelected && (
                          <span className="combobox-already-tag">Sudah di rute</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <PaginationControls
                compact
                count={filteredLocations.length}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
              />
              <div className="combobox-footer-hint">
                <span>{locations.length} titik logistik terdaftar di Bandung Raya</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Hapus tujuan ${stopNumber - 1}`}
          onClick={onRemove}
          className="stop-remove-btn"
        >
          <Icon name="close" />
        </Button>
      )}
    </div>
  );
}

export function VehicleSearchSelect({
  value,
  vehicles,
  onChange,
}: {
  value: string;
  vehicles: Vehicle[];
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedVehicle = vehicles.find((v) => v.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;
    if (typeFilter !== "all") {
      list = list.filter((v) => v.type.toLowerCase() === typeFilter.toLowerCase());
    }
    if (search.debouncedValue.trim()) {
      const q = search.debouncedValue.toLowerCase();
      list = list.filter(
        (v) =>
          v.plate.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, search.debouncedValue, typeFilter]);

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, page, pageSize]);

  return (
    <div className={`resource-selector-block ${isOpen ? "z-30" : "z-10"}`} ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor="vehicle" className="text-xs font-medium text-slate-700">Kendaraan</label>
        <span className="text-[11px] text-slate-500 font-medium">{vehicles.length} armada tersedia</span>
      </div>
      <select
        id="vehicle"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Pilih kendaraan tersedia</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.plate} {v.model}
          </option>
        ))}
      </select>

      {!selectedVehicle ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`resource-trigger-placeholder ${isOpen ? "ring-2 ring-primary/20 border-primary" : ""}`}
        >
          <div className="flex items-center gap-2.5 text-slate-500">
            <span className="text-slate-400"><Icon name="search" /></span>
            <span className="text-xs">Cari dan pilih kendaraan dari {vehicles.length} armada...</span>
          </div>
          <span className="text-slate-400"><Icon name="chevron" /></span>
        </button>
      ) : (
        <div className="resource-card-selected">
          <div className="resource-card-main min-w-0 flex-1 overflow-hidden">
            <div className="resource-card-header flex items-center gap-2 min-w-0 w-full overflow-hidden whitespace-nowrap">
              <span className="resource-plate-pill shrink-0 whitespace-nowrap">{selectedVehicle.plate}</span>
              <span className="resource-model-name flex-1 min-w-0 truncate">{selectedVehicle.model}</span>
              <span className="resource-type-badge shrink-0 whitespace-nowrap">{selectedVehicle.type}</span>
            </div>
            <div className="resource-metrics-grid flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                <Icon name="fuel" /> BBM {selectedVehicle.fuel}%
              </span>
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                <Icon name="brake" /> Rem {selectedVehicle.brake}%
              </span>
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                Odo {selectedVehicle.odometer.toLocaleString("id-ID")} km
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="resource-change-btn shrink-0"
          >
            Ganti
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="resource-popover-panel" role="dialog">
          <div className="resource-popover-search">
            <Icon name="search" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari plat nomor (cth: D 8124) atau model (cth: Gran Max)..."
              value={search.value}
              onChange={search.onChange}
              onKeyDown={search.onKeyDown}
              className="resource-search-input"
            />
            {search.value && (
              <button
                type="button"
                onClick={search.clear}
                className="combobox-clear-btn"
                aria-label="Bersihkan pencarian"
              >
                <Icon name="close" />
              </button>
            )}
          </div>

          <div className="resource-filter-pills">
            {["all", "van", "truck", "pickup", "motorcycle"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                className={`filter-pill ${typeFilter === t ? "active" : ""}`}
              >
                {t === "all" ? "Semua Tipe" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="resource-items-scroll">
            {filteredVehicles.length === 0 ? (
              <div className="combobox-empty-message">
                Tidak ada kendaraan yang cocok dengan pencarian.
              </div>
            ) : (
              paginatedVehicles.map((v) => {
                const isSelected = v.id === value;
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`resource-item-card h-14 min-h-[56px] max-h-[56px] box-border ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onChange(v.id);
                      setIsOpen(false);
                      search.clear();
                    }}
                  >
                    <div className="resource-item-left min-w-0 flex-1 overflow-hidden">
                      <div className="resource-item-title-row flex items-center gap-1.5 min-w-0 w-full overflow-hidden whitespace-nowrap">
                        <span className="resource-plate-pill shrink-0 whitespace-nowrap">{v.plate}</span>
                        <strong className="resource-item-model flex-1 min-w-0 truncate text-[11.5px] font-semibold text-slate-900" title={v.model}>{v.model}</strong>
                        <span className="resource-type-tag shrink-0 whitespace-nowrap">{v.type}</span>
                      </div>
                      <div className="resource-item-stats flex items-center gap-2 overflow-hidden whitespace-nowrap flex-nowrap">
                        <span className="stat-pill shrink-0 whitespace-nowrap"><Icon name="fuel" /> {v.fuel}%</span>
                        <span className="stat-pill shrink-0 whitespace-nowrap"><Icon name="brake" /> Rem {v.brake}%</span>
                        <span className="stat-pill shrink-0 whitespace-nowrap">{v.odometer.toLocaleString("id-ID")} km</span>
                      </div>
                    </div>
                    <div className="resource-item-right shrink-0 whitespace-nowrap">
                      {isSelected ? (
                        <span className="resource-selected-indicator"><Icon name="check" /> Terpilih</span>
                      ) : (
                        <span className="resource-available-badge">Tersedia</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <PaginationControls
            compact
            count={filteredVehicles.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
          />
          <div className="combobox-footer-hint">
            <span>Menampilkan {filteredVehicles.length} dari {vehicles.length} armada tersedia</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DriverSearchSelect({
  value,
  drivers,
  onChange,
}: {
  value: string;
  drivers: Driver[];
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const search = useDebouncedSearch("", {
    delay: 350,
    onSearch: () => setPage(1),
  });
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDriver = drivers.find((d) => d.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => b.score - a.score);
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    let list = sortedDrivers;
    if (scoreFilter === "recommended") {
      list = list.filter((d) => d.score >= 85);
    } else if (scoreFilter === "medium") {
      list = list.filter((d) => d.score >= 75 && d.score < 85);
    }
    if (search.debouncedValue.trim()) {
      const q = search.debouncedValue.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.phone && d.phone.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sortedDrivers, search.debouncedValue, scoreFilter]);

  const paginatedDrivers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDrivers.slice(start, start + pageSize);
  }, [filteredDrivers, page, pageSize]);

  return (
    <div className={`resource-selector-block ${isOpen ? "z-30" : "z-10"}`} ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor="driver" className="text-xs font-medium text-slate-700">Pengemudi</label>
        <span className="text-[11px] text-slate-500 font-medium">{drivers.length} pengemudi siap tugas</span>
      </div>
      <select
        id="driver"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Pilih pengemudi</option>
        {sortedDrivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} dengan safety score {d.score}
          </option>
        ))}
      </select>

      {!selectedDriver ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`resource-trigger-placeholder ${isOpen ? "ring-2 ring-primary/20 border-primary" : ""}`}
        >
          <div className="flex items-center gap-2.5 text-slate-500">
            <span className="text-slate-400"><Icon name="search" /></span>
            <span className="text-xs">Cari dan pilih pengemudi dari {drivers.length} personel...</span>
          </div>
          <span className="text-slate-400"><Icon name="chevron" /></span>
        </button>
      ) : (
        <div className="resource-card-selected">
          <div className="resource-card-main min-w-0 flex-1 overflow-hidden">
            <div className="resource-card-header flex items-center gap-2 min-w-0 w-full overflow-hidden whitespace-nowrap">
              <span className="resource-driver-name flex-1 min-w-0 truncate text-xs font-semibold text-slate-900">{selectedDriver.name}</span>
              <span
                className={`safety-badge-pill shrink-0 whitespace-nowrap ${
                  selectedDriver.score >= 85 ? "high" : "medium"
                }`}
              >
                Safety Score {selectedDriver.score}
              </span>
            </div>
            <div className="resource-metrics-grid flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                {selectedDriver.trips} pengantaran selesai
              </span>
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                Rem mendadak: {selectedDriver.braking}x
              </span>
              <span className="resource-metric-item shrink-0 whitespace-nowrap">
                Over-speed: {selectedDriver.speeding}x
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="resource-change-btn shrink-0"
          >
            Ganti
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="resource-popover-panel" role="dialog">
          <div className="resource-popover-search">
            <Icon name="search" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari nama pengemudi atau nomor kontak..."
              value={search.value}
              onChange={search.onChange}
              onKeyDown={search.onKeyDown}
              className="resource-search-input"
            />
            {search.value && (
              <button
                type="button"
                onClick={search.clear}
                className="combobox-clear-btn"
                aria-label="Bersihkan pencarian"
              >
                <Icon name="close" />
              </button>
            )}
          </div>

          <div className="resource-filter-pills">
            <button
              type="button"
              onClick={() => {
                setScoreFilter("all");
                setPage(1);
              }}
              className={`filter-pill ${scoreFilter === "all" ? "active" : ""}`}
            >
              Semua ({sortedDrivers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setScoreFilter("recommended");
                setPage(1);
              }}
              className={`filter-pill ${scoreFilter === "recommended" ? "active" : ""}`}
            >
              Rekomendasi (Score ≥ 85)
            </button>
            <button
              type="button"
              onClick={() => {
                setScoreFilter("medium");
                setPage(1);
              }}
              className={`filter-pill ${scoreFilter === "medium" ? "active" : ""}`}
            >
              Score 75–84
            </button>
          </div>

          <div className="resource-items-scroll">
            {filteredDrivers.length === 0 ? (
              <div className="combobox-empty-message">
                Tidak ada pengemudi yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              paginatedDrivers.map((d) => {
                const isSelected = d.id === value;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`resource-item-card h-14 min-h-[56px] max-h-[56px] box-border ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onChange(d.id);
                      setIsOpen(false);
                      search.clear();
                    }}
                  >
                    <div className="resource-item-left min-w-0 flex-1 overflow-hidden">
                      <div className="resource-item-title-row flex items-center gap-1.5 min-w-0 w-full overflow-hidden whitespace-nowrap">
                        <strong className="resource-driver-name flex-1 min-w-0 truncate text-[12px] font-semibold text-slate-900" title={d.name}>{d.name}</strong>
                        <span
                          className={`safety-badge-pill shrink-0 whitespace-nowrap ${
                            d.score >= 85 ? "high" : "medium"
                          }`}
                        >
                          Score {d.score}
                        </span>
                      </div>
                      <div className="resource-item-stats flex items-center gap-2 overflow-hidden whitespace-nowrap flex-nowrap">
                        <span className="stat-pill shrink-0 whitespace-nowrap">{d.trips} perjalanan selesai</span>
                        <span className="stat-pill shrink-0 whitespace-nowrap">Rem: {d.braking}x</span>
                        <span className="stat-pill shrink-0 whitespace-nowrap">Speed: {d.speeding}x</span>
                      </div>
                    </div>
                    <div className="resource-item-right shrink-0 whitespace-nowrap">
                      {isSelected ? (
                        <span className="resource-selected-indicator"><Icon name="check" /> Terpilih</span>
                      ) : (
                        <span className="resource-available-badge">Tersedia</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <PaginationControls
            compact
            count={filteredDrivers.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
          />
          <div className="combobox-footer-hint">
            <span>Daftar diurutkan berdasarkan Driver Safety Score tertinggi</span>
          </div>
        </div>
      )}
    </div>
  );
}
