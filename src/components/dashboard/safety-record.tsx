"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Driver, Vehicle } from "@/lib/types";
import { useFleet } from "./provider";
export function SafetyRecord({
  kind,
  record,
  onClose,
}: {
  kind: "vehicles" | "drivers";
  record: Driver | Vehicle;
  onClose: () => void;
}) {
  const vehicle = kind === "vehicles";
  const v = record as Vehicle,
    d = record as Driver;
  const [values, setValues] = useState<Record<string, number>>(
    (): Record<string, number> =>
      vehicle
        ? {
            health: v.health,
            brake: v.brake,
            fuel: v.fuel,
            odometer: v.odometer,
          }
        : { score: d.score, braking: d.braking, speeding: d.speeding },
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef("");
  const mutate = useFleet((s) => s.mutate);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      await mutate({
        action: "safety-record",
        kind,
        id: record.id,
        version: record.version || 0,
        values,
        note,
        key: key.current,
      });
      toast.success("Catatan pemeriksaan tersimpan.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pencatatan gagal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <DialogContent className="master-dialog">
        <DialogHeader>
          <DialogTitle>Catat pemeriksaan simulasi</DialogTitle>
          <DialogDescription>
            Catatan baru akan memperbarui parameter dan disimpan dalam riwayat.
            Waktu pencatatan mengikuti server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="master-fields">
            {(vehicle
              ? [
                  ["health", "Indeks kondisi"],
                  ["brake", "Estimasi kampas rem persen"],
                  ["fuel", "Bahan bakar persen"],
                  ["odometer", "Odometer km"],
                ]
              : [
                  ["score", "Skor keselamatan"],
                  ["braking", "Pengereman keras kumulatif"],
                  ["speeding", "Melebihi kecepatan kumulatif"],
                ]
            ).map(([name, label]) => (
              <div className="form-field" key={name}>
                <Label htmlFor={`safety-${name}`}>{label}</Label>
                <Input
                  required
                  id={`safety-${name}`}
                  type="number"
                  min={
                    name === "odometer"
                      ? v.odometer
                      : name === "braking"
                        ? d.braking
                        : name === "speeding"
                          ? d.speeding
                          : 0
                  }
                  max={
                    name === "odometer"
                      ? 10000000
                      : ["braking", "speeding"].includes(name)
                        ? 1000000
                        : 100
                  }
                  value={values[name]}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, [name]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="form-field">
            <Label htmlFor="safety-note">Catatan dan tindak lanjut</Label>
            <textarea
              id="safety-note"
              required
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jelaskan hasil pemeriksaan atau evaluasi pengemudi"
            />
          </div>
          {vehicle && (
            <p className="safety-input-note">
              Estimasi rem di bawah 30 persen menandai kendaraan perlu servis
              dan memblokir penugasan baru. Status servis tidak otomatis dilepas
              saat nilai membaik.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan" : "Simpan pemeriksaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
