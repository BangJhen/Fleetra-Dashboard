"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFleet } from "./provider";
import {
  BackLink,
  PageHeading,
  Status,
  Initials,
  time,
  EmptyState,
} from "./common";
import { TripRouteMap } from "./trip-route-map";
import { Icon } from "./icons";
import type { Stop } from "@/lib/types";
export function TripDetail({ id }: { id: string }) {
  const data = useFleet((s) => s.data);
  const trip = data.trips.find((t) => t.id === id);
  const [proof, setProof] = useState<Stop | null>(null);
  if (!trip)
    return (
      <div className="page">
        <BackLink href="/dashboard/dispatch">Kembali ke penugasan</BackLink>
        <EmptyState
          title="Perjalanan tidak ditemukan"
          description="Periksa ID perjalanan atau kembali ke daftar penugasan."
        />
      </div>
    );
  const vehicle = data.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = data.drivers.find((d) => d.id === trip.driverId);
  return (
    <div className="page">
      <BackLink href="/dashboard/dispatch">Kembali ke penugasan</BackLink>
      <PageHeading
        title={trip.code}
        description={`${trip.stops[0].name} dan ${trip.stops.length - 1} tujuan pengantaran`}
      >
        <Status status={trip.status} />
      </PageHeading>
      <div className="trip-detail-layout">
        <section className="content-panel">
          <div className="section-heading">
            <div>
              <h2>Timeline titik singgah</h2>
              <p>
                {trip.stops.filter((s) => s.status === "delivered").length} dari{" "}
                {trip.stops.length} titik selesai
              </p>
            </div>
            <Icon name="route" />
          </div>
          <div className="stop-timeline">
            {trip.stops.map((s, i) => (
              <div
                key={s.id}
                className={`timeline-stop ${s.status === "delivered" ? "done" : ""}`}
              >
                <span className="timeline-dot">
                  {s.status === "delivered" ? <Icon name="check" /> : i + 1}
                </span>
                <div>
                  <small>
                    {s.type === "pickup" ? "Pickup" : "Pengantaran"}{" "}
                    {i > 0 ? i : ""}
                  </small>
                  <h3>{s.name}</h3>
                  <p>{s.address}</p>
                  <span className="timeline-status">
                    {s.status === "delivered"
                      ? "Selesai"
                      : s.status === "arrived"
                        ? "Tiba di lokasi"
                        : s.status === "failed_attempt"
                          ? "Pengantaran gagal, menunggu tindak lanjut"
                          : "Menunggu pengemudi"}
                  </span>
                  {s.type === "dropoff" &&
                    s.status === "delivered" &&
                    (s.epod ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProof(s)}
                      >
                        Lihat bukti ePOD
                        <Icon name="arrow" />
                      </Button>
                    ) : (
                      <p className="proof-unavailable">
                        Bukti ePOD belum tersedia pada seed demo.
                      </p>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div>
          <section className="content-panel trip-assignment">
            <h2>Detail penugasan</h2>
            <div className="person-cell">
              <Initials name={driver?.name || "Driver"} />
              <div>
                <strong>{driver?.name}</strong>
                <small>Pengemudi bertugas</small>
              </div>
            </div>
            <dl className="review-details">
              <div>
                <dt>Armada</dt>
                <dd>{vehicle?.plate}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{vehicle?.model}</dd>
              </div>
              <div>
                <dt>Dibuat</dt>
                <dd>{time(trip.createdAt)}</dd>
              </div>
              <div>
                <dt>Jarak rute</dt>
                <dd>
                  {trip.distance
                    ? `${trip.distance.toFixed(1)} km`
                    : "Belum dihitung"}
                </dd>
              </div>
              <div>
                <dt>Durasi estimasi</dt>
                <dd>
                  {trip.duration ? `${trip.duration} menit` : "Belum dihitung"}
                </dd>
              </div>
            </dl>
          </section>
          <TripRouteMap trip={trip} vehicle={vehicle} />
        </div>
      </div>
      <Dialog
        open={!!proof}
        onOpenChange={(o) => {
          if (!o) setProof(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bukti serah terima</DialogTitle>
            <DialogDescription>{proof?.name}</DialogDescription>
          </DialogHeader>
          {proof?.epod && (
            <div className="proof-view">
              <p>Penerima: {proof.epod.recipient}</p>
              <p>{time(proof.epod.at)}</p>
              {/* Proof URLs are supplied by the data layer; seed contains no fabricated media. */}
              <Image
                alt="Foto bukti pengantaran"
                src={proof.epod.photo}
                width={600}
                height={400}
                unoptimized
              />
              <Image
                alt="Tanda tangan penerima"
                src={proof.epod.signature}
                width={600}
                height={200}
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
