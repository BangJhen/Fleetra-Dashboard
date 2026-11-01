"use client";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Icon } from "./icons";
function Controls({
  selected,
  vehicles,
}: {
  selected?: string;
  vehicles: Vehicle[];
}) {
  const map = useMap();
  const target = vehicles.find((v) => v.id === selected);
  const lat = target?.lat;
  const lng = target?.lng;
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      map.flyTo([lat, lng], 14, { duration: 0.6 });
    }
  }, [selected, map, lat, lng]);
  return (
    <div className="map-controls">
      <Button
        variant="outline"
        size="icon"
        aria-label="Perbesar peta"
        onClick={() => map.zoomIn()}
      >
        <Icon name="plus" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Perkecil peta"
        onClick={() => map.zoomOut()}
      >
        <span className="minus-icon" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Pusatkan peta Bandung"
        onClick={() =>
          map.fitBounds(
            vehicles.length
              ? L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]))
              : L.latLngBounds([
                  [-6.96, 107.54],
                  [-6.85, 107.7],
                ]),
            { padding: [35, 35] },
          )
        }
      >
        <Icon name="locate" />
      </Button>
    </div>
  );
}
export default function FleetMap({
  vehicles = [],
  selected,
  onSelect,
  playing = true,
  route,
  points,
}: {
  vehicles?: Vehicle[];
  selected?: string;
  onSelect?: (id: string) => void;
  playing?: boolean;
  route?: [number, number][];
  points?: { lat: number; lng: number; name: string }[];
}) {
  const [tick, setTick] = useState(0);
  const [labels, setLabels] = useState(true);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div className={labels ? "map-canvas" : "map-canvas vivid-map"}>
      <MapContainer
        center={[-6.909, 107.616]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom
        attributionControl
        className="leaflet-map"
      >
        <TileLayer
          url={
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        {vehicles.map((v) => {
          const color =
            v.status === "moving"
              ? "#2463D8"
              : v.status === "idle"
                ? "#A47727"
                : "#B15050";
          const offset =
            v.status === "moving" ? Math.sin(tick * 0.1) * 0.0004 : 0;
          return (
            <Marker
              key={v.id}
              title={v.plate}
              alt={v.plate}
              position={[v.lat + offset, v.lng + offset]}
              icon={L.divIcon({
                className: `vehicle-map-marker ${selected === v.id ? "selected-marker" : ""}`,
                html: `<div style="--marker-color:${color};transform:rotate(${v.heading}deg)"><svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M8 2 14 17 8 14 2 17 8 2Z" fill="currentColor" stroke="white" stroke-width="1.5"/></svg></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
              eventHandlers={{ click: () => onSelect?.(v.id) }}
            >
              <Tooltip
                direction="top"
                offset={[0, -14]}
                permanent={selected === v.id}
              >
                {v.plate}
              </Tooltip>
            </Marker>
          );
        })}
        {route && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#2463D8", weight: 4, opacity: 0.85 }}
          />
        )}
        {points?.map((p, i) => (
          <Marker
            key={`${p.name}-${i}`}
            title={p.name}
            alt={p.name}
            position={[p.lat, p.lng]}
            icon={L.divIcon({
              className: "stop-map-marker",
              html: `<span>${i + 1}</span>`,
              iconSize: [28, 28],
            })}
          >
            <Tooltip>{p.name}</Tooltip>
          </Marker>
        ))}
        <Controls selected={selected} vehicles={vehicles} />
      </MapContainer>
      <Button
        variant="outline"
        size="icon"
        aria-label="Ganti kontras peta"
        className="map-layer-button"
        onClick={() => setLabels((l) => !l)}
      >
        <Icon name="layers" />
      </Button>
      <div className="map-region-label">
        <span className="map-region-dot" />
        Bandung Raya
        <span className="map-region-separator" />
        Simulasi GPS
      </div>
      {tileError && (
        <div className="map-error">
          Sebagian peta gagal dimuat. Daftar armada tetap dapat diakses.
        </div>
      )}
      <div className="map-legend">
        <span>
          <i style={{ background: "#2463D8" }} />
          Bergerak
        </span>
        <span>
          <i style={{ background: "#A47727" }} />
          Idle
        </span>
        <span>
          <i style={{ background: "#B15050" }} />
          Servis
        </span>
      </div>
    </div>
  );
}
