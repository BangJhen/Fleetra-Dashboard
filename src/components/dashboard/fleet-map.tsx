"use client";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Tooltip,
  Popup,
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
        <Icon name="zoomIn" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Perkecil peta"
        onClick={() => map.zoomOut()}
      >
        <Icon name="zoomOut" />
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
  route,
  points,
  allLocations,
  selectedIndices,
  onAddStop,
}: {
  vehicles?: Vehicle[];
  selected?: string;
  onSelect?: (id: string) => void;
  route?: [number, number][];
  points?: { lat: number; lng: number; name: string }[];
  allLocations?: { name: string; address: string; lat: number; lng: number }[];
  selectedIndices?: number[];
  onAddStop?: (index: number) => void;
}) {
  const [tileError, setTileError] = useState(false);
  const mappedVehicles = vehicles.filter((vehicle) => Number.isFinite(vehicle.lat) && Number.isFinite(vehicle.lng));
  const firstPoint = points?.[0] || allLocations?.[0] || mappedVehicles[0];
  const center: [number, number] = firstPoint ? [firstPoint.lat, firstPoint.lng] : [-6.909, 107.616];
  return (
    <div className="map-canvas">
      <MapContainer
        center={center}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom
        attributionControl={false}
        className="leaflet-map"
      >
        <PlaceBasemap onError={setTileError} />
        {mappedVehicles.map((v) => {
          const color =
            v.status === "moving"
              ? "#2463D8"
              : v.status === "idle"
                ? "#64748B"
                : "#1E57C7";
          return (
            <Marker
              key={v.id}
              title={v.plate}
              alt={v.plate}
              position={[v.lat, v.lng]}
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
            <Tooltip>{i === 0 ? `Asal: ${p.name}` : `Tujuan ${i}: ${p.name}`}</Tooltip>
          </Marker>
        ))}
        {allLocations?.map((loc, idx) => {
          if (selectedIndices?.includes(idx)) return null;
          return (
            <Marker
              key={`hub-unassigned-${idx}`}
              position={[loc.lat, loc.lng]}
              title={loc.name}
              alt={loc.name}
              icon={L.divIcon({
                className: "available-location-marker",
                html: `<div class="hub-marker-pin"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2463D8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 26],
                popupAnchor: [0, -26],
              })}
            >
              <Popup className="fleetra-map-popup">
                <div className="location-popup-card">
                  <span className="location-popup-tag">Titik Logistik</span>
                  <strong className="location-popup-name">{loc.name}</strong>
                  <p className="location-popup-addr">{loc.address}</p>
                  {onAddStop && (
                    <button
                      type="button"
                      className="location-popup-action"
                      onClick={() => onAddStop(idx)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      Tambah ke rute
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        <RouteFraming route={route} points={points} />
        <Controls selected={selected} vehicles={mappedVehicles} route={route} points={points} />
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
