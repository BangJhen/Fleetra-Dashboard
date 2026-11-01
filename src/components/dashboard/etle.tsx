"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFleet } from "./provider";
import {
  BackLink,
  PageHeading,
  Status,
  EmptyState,
  date,
  time,
} from "./common";
import { Icon } from "./icons";
export function Etle({ id }: { id?: string }) {
  const data = useFleet((s) => s.data);
  const mutate = useFleet((s) => s.mutate);
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [plate, setPlate] = useState("");
  const [at, setAt] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await mutate({
        action: "etle",
        reference,
        plate,
        at: new Date(at + "+07:00").toISOString(),
        location,
      });
      router.push(`/dashboard/finance/etle/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kasus gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }
  async function review(status: string) {
    setBusy(true);
    try {
      await mutate({ action: "review-etle", id, status });
      toast.success(
        status === "confirmed"
          ? "Konfirmasi internal disimpan."
          : "Kasus ditandai untuk sengketa.",
      );
    } catch {
    } finally {
      setBusy(false);
    }
  }
  if (id) {
    const record = data.etle.find((e) => e.id === id);
    if (!record)
      return (
        <div className="page">
          <BackLink href="/dashboard/finance/etle">Kembali ke ETLE</BackLink>
          <EmptyState
            title="Kasus tidak ditemukan"
            description="Buka kasus dari daftar rekonsiliasi."
          />
        </div>
      );
    return (
      <div className="page">
        <BackLink href="/dashboard/finance/etle">
          Kembali ke rekonsiliasi ETLE
        </BackLink>
        <PageHeading
          title={record.reference}
          description={`${record.plate} pada ${date(record.at)} pukul ${time(record.at)}`}
        >
          <Status status={record.status} />
        </PageHeading>
        <section className="content-panel etle-result">
          <h2>Hasil pencocokan perjalanan</h2>
          <p>
            {record.candidates.length === 0
              ? "Tidak ada perjalanan aktif yang cocok dengan plat dan waktu kejadian."
              : record.candidates.length === 1
                ? "Satu kandidat perjalanan ditemukan. Periksa rincian sebelum mengonfirmasi."
                : "Beberapa perjalanan cocok. Kasus memerlukan pemeriksaan manual."}
          </p>
          <dl className="review-details">
            <div>
              <dt>Lokasi kamera</dt>
              <dd>{record.location}</dd>
            </div>
            <div>
              <dt>Dasar pencocokan</dt>
              <dd>Plat kendaraan dan interval perjalanan</dd>
            </div>
            <div>
              <dt>Sumber tilang</dt>
              <dd>{record.source === "simulasi" ? "Contoh simulasi FLEETRA" : "Input manual operator"}</dd>
            </div>
          </dl>
          {record.candidates.map((tid) => {
            const t = data.trips.find((t) => t.id === tid);
            const d = data.drivers.find((d) => d.id === t?.driverId);
            return (
              <Link
                key={tid}
                className="etle-candidate"
                href={`/dashboard/dispatch/${tid}`}
              >
                <div>
                  <small>Kandidat perjalanan</small>
                  <strong>{t?.code}</strong>
                  <p>
                    {d?.name} mulai {t?.startedAt && time(t.startedAt)}
                  </p>
                </div>
                <Icon name="arrow" />
              </Link>
            );
          })}
          <div className="inline-controls">
            {record.candidates.length === 1 &&
              record.status === "candidate_match" && (
                <Button disabled={busy} onClick={() => review("confirmed")}>
                  Konfirmasi internal
                </Button>
              )}
            {!["confirmed", "disputed"].includes(record.status) && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => review("disputed")}
              >
                Tandai sengketa
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeading
        title="Tilang ETLE"
        description="Cocokkan bukti kamera tilang elektronik dengan riwayat perjalanan armada."
      />
      <div className="etle-layout">
        <section className="content-panel etle-form">
          <div className="section-heading">
            <div>
              <h2>Cek data perjalanan</h2>
              <p>Cocokkan plat dan waktu kejadian dengan perjalanan armada.</p>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="reference">Nomor referensi tilang</Label>
              <Input
                id="reference"
                maxLength={100}
                required
                placeholder="Contoh BDG ETLE 2026 004"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="plate">Plat kendaraan</Label>
              <Input
                id="plate"
                maxLength={20}
                required
                placeholder="B 9821 KCE"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="violation-time">Tanggal dan jam kejadian</Label>
              <Input
                id="violation-time"
                type="datetime-local"
                required
                value={at}
                onChange={(e) => setAt(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="camera">Lokasi kamera</Label>
              <Input
                id="camera"
                maxLength={200}
                placeholder="Nama ruas jalan atau lokasi kamera"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" className="full-width" disabled={busy}>
              {busy ? "Mencocokkan data" : "Cek data perjalanan"}
              <Icon name="arrow" />
            </Button>
          </form>
        </section>
        <section className="content-panel etle-cases">
          <div className="section-heading">
            <div>
              <h2>Kasus tersimpan</h2>
              <p>{data.etle.length} kasus untuk ditinjau</p>
            </div>
          </div>
          {data.etle.length === 0 ? (
            <EmptyState
              title="Belum ada kasus ETLE"
              description="Hasil pencocokan akan tersimpan di sini untuk ditinjau kembali."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referensi dan armada</TableHead>
                  <TableHead>Kejadian</TableHead>
                  <TableHead>Hasil pencocokan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.etle.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at)).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        className="table-primary-link"
                        href={`/dashboard/finance/etle/${e.id}`}
                      >
                        {e.reference}
                      </Link>
                      <small className="table-secondary">{e.plate}{e.source === "simulasi" ? "  Simulasi" : ""}</small>
                    </TableCell>
                    <TableCell>
                      <span>{date(e.at)} pukul {time(e.at)}</span>
                      <small className="table-secondary">{e.location}</small>
                    </TableCell>
                    <TableCell>
                      <span className="etle-case-status">
                        <Status status={e.status} />
                        <small>{e.candidates.length} kandidat perjalanan</small>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
