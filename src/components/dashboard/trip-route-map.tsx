"use client";
import { useEffect, useState } from "react";
import type { Trip, Vehicle } from "@/lib/types";
import type { RoutePoint } from "@/lib/road-route";
import { FleetMap } from "./map-loader";
import { Button } from "@/components/ui/button";

export function TripRouteMap({ trip, vehicle }: { trip: Trip; vehicle?: Vehicle }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; route?: RoutePoint[]; error?: string }>();
  const coordinates = JSON.stringify(trip.stops.map(p => [p.lat, p.lng]));
  const key = `${trip.id}:${coordinates}:${attempt}`;
  const route = trip.route || (result?.key === key ? result.route : undefined);
  const error = result?.key === key ? result.error : undefined;
  useEffect(() => {
    if (trip.route?.length) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/trips/${encodeURIComponent(trip.id)}/route`, { method: "POST", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Rute belum dapat dimuat.");
        if (active) setResult({ key, route: data.route });
      } catch (e) {
        if (active && !controller.signal.aborted) setResult({ key, error: e instanceof Error ? e.message : "Rute belum dapat dimuat." });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [key, trip.id, trip.route]);
  return <div className="content-panel trip-map">
    <FleetMap points={trip.stops} vehicles={vehicle ? [vehicle] : []} route={route} />
    {!route && <div className="trip-route-status" role={error ? "alert" : "status"}>
      <span>{error || "Memuat rute OSRM"}</span>
      {error && <Button size="sm" variant="ghost" onClick={() => setAttempt(n => n + 1)}>Coba lagi</Button>}
    </div>}
  </div>;
}
