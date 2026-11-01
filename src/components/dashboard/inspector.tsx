"use client";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFleet } from "./provider";
import { Status, Initials } from "./common";
import { VehicleArt } from "./vehicle-art";
import { vehicleType, vehicleTypeLabels } from "@/lib/vehicle-types";
import { Icon } from "./icons";
export function Inspector({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const data = useFleet((s) => s.data);
  const v = data.vehicles.find((v) => v.id === id);
  const d = data.drivers.find((d) => d.id === v?.driverId);
  const trip = data.trips.find(
    (t) => t.vehicleId === id && ["assigned", "in_progress"].includes(t.status),
  );
  return (
    <Sheet
      open={!!v}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="inspector">
        <SheetHeader>
          <SheetDescription>Inspeksi armada</SheetDescription>
          <SheetTitle>{v?.plate}</SheetTitle>
        </SheetHeader>
        {v && (
          <div className="inspector-body">
            <div className="vehicle-illustration">
              <VehicleArt vehicle={v} />
            </div>
            <div className="inspector-model">
              <div><h3>{v.model}</h3><small className="vehicle-type-label">{vehicleTypeLabels[vehicleType(v)]}</small></div>
              <Status status={v.status} />
            </div>
            <p className="muted">{v.location}</p>
            {d ? <div className="inspector-driver">
              <Initials name={d.name} />
              <div>
                <small>Pengemudi aktif</small>
                <strong>{d.name}</strong>
              </div>
              <Link
                href={`/dashboard/safety/drivers/${d.id}`}
                aria-label="Lihat profil pengemudi"
              >
                <Icon name="chevron" />
              </Link>
            </div>
            : <p className="muted inspector-driver">Pengemudi belum ditetapkan</p>}
            <h3 className="subsection-label">Telemetri kendaraan</h3>
            <div className="telemetry-grid">
              {[
                {
                  icon: "speed" as const,
                  label: "Kecepatan",
                  value: v.speed,
                  unit: "km per jam",
                },
                {
                  icon: "fuel" as const,
                  label: "Bahan bakar",
                  value: v.fuel,
                  unit: "persen",
                },
                {
                  icon: "brake" as const,
                  label: "Estimasi rem",
                  value: v.brake,
                  unit: "persen",
                },
                {
                  icon: "route" as const,
                  label: "Odometer",
                  value: v.odometer.toLocaleString("id-ID"),
                  unit: "km",
                },
              ].map((m) => (
                <div key={m.label}>
                  <Icon name={m.icon} />
                  <small>{m.label}</small>
                  <strong>
                    {m.value}
                    <span>{m.unit}</span>
                  </strong>
                </div>
              ))}
            </div>
            {trip && (
              <div className="inspector-trip">
                <small>Penugasan aktif</small>
                <strong>{trip.code}</strong>
                <p>
                  {trip.stops.filter((s) => s.status === "delivered").length}{" "}
                  dari {trip.stops.length} titik selesai
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/dispatch/${trip.id}`}>
                    Lihat perjalanan
                    <Icon name="arrow" />
                  </Link>
                </Button>
              </div>
            )}
            <Button className="full-width" asChild>
              <Link href={`/dashboard/safety/vehicles/${v.id}`}>
                Lihat kondisi armada
                <Icon name="arrow" />
              </Link>
            </Button>
            {d?.phone ? (
              <Button asChild variant="outline" className="full-width">
                <a href={`tel:${d.phone}`}>
                  <Icon name="phone" />
                  Hubungi pengemudi
                </a>
              </Button>
            ) : (
              <p className="muted inspector-contact">
                Kontak pengemudi belum tersedia pada data demo.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
