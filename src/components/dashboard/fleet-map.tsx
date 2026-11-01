"use client";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { setWorkerUrl } from "maplibre-gl";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Icon } from "./icons";
function PlaceBasemap({ onError }: { onError: (failed: boolean) => void }) {
  const map = useMap();
  useEffect(() => {
    setWorkerUrl("/maps/maplibre-gl-worker.mjs");
    const layer = maplibreGL({
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || "/maps/fleetra-places.json",
      attributionControl: false,
      interactive: false,
    }).addTo(map);
    const basemap = layer.getMaplibreMap();
    const ready = () => {
      map.getContainer().setAttribute("data-basemap-ready", "true");
      onError(false);
    };
    const loading = () => map.getContainer().removeAttribute("data-basemap-ready");
    map.on("movestart", loading);
    basemap.on("movestart", loading);
    basemap.on("idle", ready);
    basemap.on("error", () => onError(true));
    return () => {
      map.off("movestart", loading);
      map.getContainer().removeAttribute("data-basemap-ready");
      map.removeLayer(layer);
    };
  }, [map, onError]);
  return null;
}
function MapSources() {
  const map = useMap();
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    if (!expanded) return;
    const collapse = () => setExpanded(false);
    const timer = setTimeout(collapse, 5000);
    map.on("dragstart", collapse);
    return () => { clearTimeout(timer); map.off("dragstart", collapse); };
  }, [map, expanded]);
  return <details className="map-source-control" open={expanded}
    onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <summary onClick={e => { e.preventDefault(); setExpanded(value => !value); }}>Sumber peta</summary>
    <div>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
    </div>
  </details>;
}
function RouteFraming({ route, points }: {
  route?: [number, number][]; points?: { lat: number; lng: number }[];
}) {
  const map = useMap();
  const coordinates = route?.length ? route : points?.map(p => [p.lat, p.lng] as [number, number]);
  const bounds = coordinates?.length ? L.latLngBounds(coordinates).toBBoxString() : "";
  useEffect(() => {
    if (!bounds) return;
    const [west, south, east, north] = bounds.split(",").map(Number);
    const frame = () => map.fitBounds([[south, west], [north, east]], { padding: [36, 36], maxZoom: 15, animate: false });
    frame();
    map.on("resize", frame);
    return () => { map.off("resize", frame); };
  }, [map, bounds]);
  return null;
}
function Controls({
  selected, vehicles, route, points,
}: {
  selected?: string;
  vehicles: Vehicle[];
  route?: [number, number][];
  points?: { lat: number; lng: number }[];
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
        aria-label={route?.length ? "Pusatkan rute" : "Pusatkan peta Bandung"}
        onClick={() =>
          map.fitBounds(
            route?.length || points?.length || vehicles.length
              ? L.latLngBounds(route?.length ? route : (points?.length ? points : vehicles).map((v) => [v.lat, v.lng] as [number, number]))
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
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div className="map-canvas">
      <MapContainer
        center={[-6.909, 107.616]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom
        attributionControl={false}
        className="leaflet-map"
      >
        <PlaceBasemap onError={setTileError} />
        {vehicles.map((v) => {
          const color =
            v.status === "moving"
              ? "#2463D8"
              : v.status === "idle"
                ? "#64748B"
                : "#1E57C7";
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
            pathOptions={{ color: "#2463D8", weight: 4, opacity: 0.9, className: "osrm-route" }}
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
        <RouteFraming route={route} points={points} />
        <Controls selected={selected} vehicles={vehicles} route={route} points={points} />
        <MapSources />
      </MapContainer>
      {tileError && (
        <div className="map-error">
          Sebagian peta gagal dimuat. Daftar armada tetap dapat diakses.
        </div>
      )}
    </div>
  );
}
