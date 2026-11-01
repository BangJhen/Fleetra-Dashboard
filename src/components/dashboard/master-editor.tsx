"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vehicleType, vehicleTypes, vehicleTypeLabels } from "@/lib/vehicle-types";
import type { Driver, Vehicle } from "@/lib/types";
import { useFleet } from "./provider";
export function MasterEditor({
  kind,
  record,
  onClose,
}: {
  kind: "vehicles" | "drivers";
  record?: Vehicle | Driver;
  onClose: () => void;
}) {
  const data = useFleet((s) => s.data);
  const locations = data.locations;
  const mutate = useFleet((s) => s.mutate);
  const vehicle = kind === "vehicles";
  const v = record as Vehicle | undefined;
  const d = record as Driver | undefined;
  const [values, setValues] = useState<Record<string, string>>(
    (): Record<string, string> =>
      vehicle
        ? {
            plate: v?.plate || "",
            model: v?.model || "",
            type: v ? vehicleType(v) : "van",
            status: v?.status === "service" ? "service" : "idle",
            driverId: v?.driverId || "",
            fuel: String(v?.fuel || 0),
            brake: String(v?.brake ?? 100),
            health: String(v?.health ?? 100),
            odometer: String(v?.odometer || 0),
            locationIndex: String(
              Math.max(
                0,
                locations.findIndex((l) => l.address === v?.location),
              ),
            ),
          }
        : {
            name: d?.name || "",
            phone: d?.phone || "",
            score: String(d?.score || 0),
          },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef("");
  const field = (name: string, label: string, type = "text", max?: number) => (
    <div className="form-field">
      <Label htmlFor={`master-${name}`}>{label}</Label>
      <Input
        id={`master-${name}`}
        type={type}
        required={name !== "phone"}
        min={type === "number" ? 0 : undefined}
        max={max}
        maxLength={name === "plate" ? 16 : 100}
        value={values[name]}
        onChange={(e) => setValues((s) => ({ ...s, [name]: e.target.value }))}
      />
    </div>
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    if (!key.current) key.current = crypto.randomUUID();
    const payload: Record<string, unknown> = { ...values };
    for (const n of [
      "fuel",
      "brake",
      "health",
      "odometer",
      "locationIndex",
      "score",
    ])
      if (n in payload) payload[n] = Number(payload[n]);
    try {
      await mutate({
        action: "master-save",
        kind,
        id: record?.id,
        version: record?.version || 0,
        key: key.current,
        values: payload,
      });
      toast.success(
        record ? "Perubahan tersimpan." : "Data berhasil ditambahkan.",
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Penyimpanan gagal.");
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
          <DialogTitle>
            {record ? "Ubah" : "Tambah"} {vehicle ? "armada" : "pengemudi"}
          </DialogTitle>
          <DialogDescription>
            {vehicle
              ? "Data kondisi dan lokasi pada MVP ini merupakan input simulasi."
              : "Skor keselamatan merupakan input simulasi. Gunakan 0 jika belum dievaluasi."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="master-fields">
            {vehicle ? (
              <>
                {field("plate", "Plat kendaraan")}
                <div className="form-field">
                  <Label htmlFor="master-type">Jenis kendaraan</Label>
                  <select id="master-type" required value={values.type}
                    onChange={(e) => setValues((s) => ({ ...s, type: e.target.value }))}>
                    {vehicleTypes.map((type) => <option key={type} value={type}>{vehicleTypeLabels[type]}</option>)}
                  </select>
                </div>
                {field("model", "Model kendaraan")}
                <div className="form-field">
                  <Label htmlFor="master-status">Status operasional</Label>
                  <select
                    id="master-status"
                    value={values.status}
                    onChange={(e) =>
                      setValues((s) => ({ ...s, status: e.target.value }))
                    }
                  >
                    <option value="idle">Idle</option>
                    <option value="service">Perlu servis</option>
                  </select>
                </div>
                <div className="form-field">
                  <Label htmlFor="master-driverId">Pengemudi referensi</Label>
                  <select
                    id="master-driverId"
                    value={values.driverId}
                    onChange={(e) =>
                      setValues((s) => ({ ...s, driverId: e.target.value }))
                    }
                  >
                    <option value="">Belum dialokasikan</option>
                    {data.drivers
                      .filter(
                        (d) =>
                          !d.archivedAt &&
                          !data.vehicles.some(
                            (v) =>
                              !v.archivedAt &&
                              v.id !== record?.id &&
                              v.driverId === d.id,
                          ),
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
                {field("fuel", "Bahan bakar persen", "number", 100)}
                {field("brake", "Estimasi rem persen", "number", 100)}
                {field("health", "Indeks kondisi", "number", 100)}
                {field("odometer", "Odometer km", "number", 10000000)}
                <div className="form-field">
                  <Label htmlFor="master-locationIndex">Lokasi simulasi</Label>
                  <select
                    id="master-locationIndex"
                    value={values.locationIndex}
                    onChange={(e) =>
                      setValues((s) => ({
                        ...s,
                        locationIndex: e.target.value,
                      }))
                    }
                  >
                    {locations.map((l, i) => (
                      <option key={i} value={i}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {field("name", "Nama pengemudi")}
                {field("phone", "Nomor telepon")}
                {field("score", "Skor keselamatan simulasi", "number", 100)}
              </>
            )}
          </div>
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
              {busy ? "Menyimpan" : "Simpan data"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function MasterArchive({
  kind,
  record,
  onClose,
}: {
  kind: "vehicles" | "drivers";
  record: Vehicle | Driver;
  onClose: () => void;
}) {
  const mutate = useFleet((s) => s.mutate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const restore = !!record.archivedAt;
  async function submit() {
    setBusy(true);
    try {
      await mutate({
        action: restore ? "master-restore" : "master-archive",
        kind,
        id: record.id,
        version: record.version || 0,
      });
      toast.success(
        restore ? "Data berhasil dipulihkan." : "Data berhasil diarsipkan.",
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan gagal.");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{restore ? "Pulihkan" : "Arsipkan"} data</DialogTitle>
          <DialogDescription>
            {restore
              ? "Data akan kembali tersedia pada daftar aktif."
              : "Data dikeluarkan dari operasi dan penugasan baru. Riwayat perjalanan tetap tersimpan."}
          </DialogDescription>
        </DialogHeader>
        <strong>{"plate" in record ? record.plate : record.name}</strong>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Menyimpan" : restore ? "Pulihkan data" : "Arsipkan data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
