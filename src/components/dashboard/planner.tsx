"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFleet } from "./provider";
import { availableResources } from "@/lib/domain";
import { FleetMap } from "./map-loader";
import { BackLink, PageHeading } from "./common";
import { Icon } from "./icons";
import {
  LocationSearchSelect,
  VehicleSearchSelect,
  DriverSearchSelect,
} from "./planner-selectors";
type Optimized = {
  order: number[];
  distance: number;
  duration: number;
  route: [number, number][];
  source: string;
};
export function Planner() {
  const data = useFleet((s) => s.data);
  const locations = data.locations;
  const mutate = useFleet((s) => s.mutate);
  const router = useRouter();
  const [stops, setStops] = useState(() => data.locations.slice(0, 4).map((_, index) => index));
  const [vehicleId, setVehicle] = useState("");
  const [driverId, setDriver] = useState("");
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${stops.map((index) => `${index}:${locations[index]?.lat}:${locations[index]?.lng}`).join(",")}:${attempt}`;
  const [routing, setRouting] = useState<{
    key: string; status: "pending" | "ready" | "error";
    result?: Optimized; error?: string;
  }>({ key: "", status: "pending" });
  const busy = routing.key !== requestKey || routing.status === "pending";
  const optimized = routing.key === requestKey ? routing.result : undefined;
  const error = routing.key === requestKey ? routing.error : undefined;
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState(false);
  const key = useRef("");
  const resources = availableResources(data);
  const ordered = optimized?.order || stops;
  const points = ordered.map((n) => locations[n]);
  const selectedDriver = data.drivers.find((d) => d.id === driverId);
  const selectedVehicle = data.vehicles.find((v) => v.id === vehicleId);
  function changeStops(next: number[]) {
    setStops(next);
    setReview(false);
  }
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stops }),
          signal: controller.signal,
        });
        const result = await res.json();
        if (!res.ok) throw Error(result.error || "Rute gagal dihitung.");
        if (active) setRouting({ key: requestKey, status: "ready", result });
      } catch (e) {
        if (active && !controller.signal.aborted) setRouting({
          key: requestKey, status: "error",
          error: e instanceof Error ? e.message : "Rute gagal dihitung.",
        });
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [stops, requestKey]);
  async function publish() {
    if (saving || busy) return;
    setSaving(true);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const result = await mutate({
        action: "create-trip",
        key: key.current,
        vehicleId,
        driverId,
        stops: ordered,
        distance: optimized?.distance || 0,
        duration: optimized?.duration || 0,
        route: optimized?.route,
      });
      toast.success("Penugasan tersimpan.");
      router.push(`/dashboard/dispatch/${result.id}`);
    } catch {
      setReview(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page">
      <BackLink href="/dashboard/dispatch">Kembali ke penugasan</BackLink>
      <PageHeading
        title="Buat penugasan"
        description="Susun titik singgah, rencanakan rute, dan alokasikan armada."
      />
      <div className="planner-layout">
        <div className="planner-form">
          <section className="content-panel planner-section">
            <div className="numbered-heading">
              <span>1</span>
              <div>
                <h2>Susun rute perjalanan</h2>
                <p>Gudang asal dan tujuan pengantaran dapat dicari atau diklik dari peta.</p>
              </div>
            </div>
            <div className="stop-fields">
              {ordered.map((n, i) => (
                <LocationSearchSelect
                  key={`stop-${i}`}
                  id={`stop-${i}`}
                  value={n}
                  locations={locations}
                  selectedIndices={ordered}
                  onChange={(nextIndex) =>
                    changeStops(
                      ordered.map((p, j) => (i === j ? nextIndex : p)),
                    )
                  }
                  onRemove={
                    i > 1
                      ? () => changeStops(ordered.filter((_, j) => j !== i))
                      : undefined
                  }
                  stopNumber={i + 1}
                  isOrigin={i === 0}
                />
              ))}
            </div>
            <Button
              variant="outline"
              className="add-stop"
              disabled={ordered.length >= locations.length}
              onClick={() =>
                changeStops([
                  ...ordered,
                  locations.findIndex((_, i) => !ordered.includes(i)),
                ])
              }
            >
              <Icon name="plus" />
              Tambah tujuan
            </Button>
            <p className="route-optimization-status" role="status">
              {busy ? "Mengoptimasi rute dengan OSRM" : optimized ? "Rute diperbarui otomatis" : "Optimasi belum tersedia"}
            </p>
            {error && <Button variant="outline" size="sm" onClick={() => setAttempt(n => n + 1)}>Coba lagi OSRM</Button>}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
          </section>
          <section className="content-panel planner-section">
            <div className="numbered-heading">
              <span>2</span>
              <div>
                <h2>Alokasikan sumber daya</h2>
                <p>Cari kendaraan dan pengemudi berdasarkan ketersediaan dan performa.</p>
              </div>
            </div>
            <div className="resource-allocation-group">
              <VehicleSearchSelect
                value={vehicleId}
                vehicles={resources.vehicles}
                onChange={setVehicle}
              />
              <DriverSearchSelect
                value={driverId}
                drivers={resources.drivers}
                onChange={setDriver}
              />
            </div>
          </section>
        </div>
        <div className="planner-preview">
          <div className="content-panel planner-map">
            <div className="section-heading">
              <h2>Pratinjau rute</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                  {locations.length} titik aktif di peta
                </span>
                <span className="muted">{points.length} titik singgah</span>
              </div>
            </div>
            <FleetMap
              points={points}
              route={optimized?.route}
              allLocations={locations}
              selectedIndices={ordered}
              onAddStop={(idx) => {
                if (!ordered.includes(idx)) {
                  changeStops([...ordered, idx]);
                  toast.success(`Menambahkan ${locations[idx]?.name} ke rute.`);
                }
              }}
            />
            <p className="planner-map-instruction">
              <Icon name="locate" />
              <span>Klik penanda titik logistik biru di peta untuk langsung menambahkan tujuan ke rute.</span>
            </p>
            <div className="route-estimates">
              <div>
                <span>Total jarak</span>
                <strong>
                  {optimized
                    ? `${optimized.distance.toFixed(1)} km`
                    : busy ? "Menghitung" : "Belum dihitung"}
                </strong>
              </div>
              <div>
                <span>Estimasi berkendara</span>
                <strong>
                  {optimized ? `${optimized.duration} menit` : busy ? "Menghitung" : "Belum dihitung"}
                </strong>
              </div>
              <div>
                <span>Sumber rute</span>
                <strong>{optimized ? "OSRM" : busy ? "Mengoptimasi" : "Urutan manual"}</strong>
              </div>
            </div>
          </div>
          <p className="planner-route-hint">
            {optimized
              ? "Estimasi OSRM tidak memperhitungkan kemacetan real-time dan durasi bongkar muat."
              : busy ? "Titik singgah ditampilkan sambil menunggu rute jalan."
              : "Rute jalan belum tersedia. Jalankan optimasi ulang untuk melihatnya."}
          </p>
          <div className="planner-submit">
            <p>{ordered.length - 1} pengantaran dan 1 pickup</p>
            <Button
              disabled={!vehicleId || !driverId || busy}
              onClick={() => setReview(true)}
            >
              Tinjau penugasan
              <Icon name="arrow" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tinjau penugasan</DialogTitle>
            <DialogDescription>
              Periksa alokasi dan urutan titik sebelum menyimpan tugas.
            </DialogDescription>
          </DialogHeader>
          <dl className="review-details">
            <div>
              <dt>Pengemudi</dt>
              <dd>{selectedDriver?.name}</dd>
            </div>
            <div>
              <dt>Kendaraan</dt>
              <dd>{selectedVehicle?.plate}</dd>
            </div>
            <div>
              <dt>Rute</dt>
              <dd>
                {optimized
                  ? "Hasil OSRM"
                  : "Urutan manual, jarak belum dihitung"}
              </dd>
            </div>
          </dl>
          <ol className="review-stops">
            {points.map((p) => (
              <li key={p.name}>{p.name}</li>
            ))}
          </ol>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReview(false)}
              disabled={saving}
            >
              Kembali
            </Button>
            <Button onClick={publish} disabled={saving || busy}>
              {saving ? "Menyimpan" : "Simpan penugasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
