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
  DemoNote,
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
          description={`${record.plate} / ${date(record.at)} / ${time(record.at)}`}
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
              <dd>Input manual operator</dd>
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
                    {d?.name} / {t?.startedAt && time(t.startedAt)}
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
          <DemoNote>
            Kecocokan waktu tidak membuktikan pelanggaran hukum. Tidak ada akses
            ke API ETLE pemerintah.
          </DemoNote>
        </section>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeading
        title="Rekonsiliasi ETLE"
        description="Telusuri penugasan yang relevan. Tinjau dengan bukti yang tersedia."
      />
      <div className="etle-layout">
        <section className="content-panel etle-form">
          <div className="section-heading">
            <div>
              <h2>Cek data perjalanan</h2>
              <p>Masukkan informasi dari surat tilang.</p>
            </div>
            <Icon name="search" />
          </div>
          <form onSubmit={submit}>
            <div className="form-field">
              <Label htmlFor="reference">Nomor referensi tilang</Label>
              <Input
                id="reference"
                maxLength={100}
                required
                placeholder="Contoh ETLE-2026-001"
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
              <small>Gunakan waktu Indonesia Barat (WIB).</small>
            </div>
            <div className="form-field">
              <Label htmlFor="camera">Lokasi kamera</Label>
              <Input
                id="camera"
                maxLength={200}
                placeholder="Opsional, nama ruas jalan"
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
          <DemoNote>
            Rekonsiliasi internal berdasarkan data simulasi. Tanpa integrasi
            ETLE resmi.
          </DemoNote>
        </section>
        <section className="content-panel etle-cases">
          <div className="section-heading">
            <div>
              <h2>Kasus tersimpan</h2>
              <p>{data.etle.length} kasus dalam workspace</p>
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
                  <TableHead>Referensi & armada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.etle.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        className="table-primary-link"
                        href={`/dashboard/finance/etle/${e.id}`}
                      >
                        {e.reference}
                      </Link>
                      <small className="table-secondary">{e.plate}</small>
                    </TableCell>
                    <TableCell>
                      <Status status={e.status} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" asChild>
                        <Link
                          aria-label={`Buka ${e.reference}`}
                          href={`/dashboard/finance/etle/${e.id}`}
                        >
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="etle-method">
            <h3>Bagaimana pencocokan bekerja</h3>
            <ol>
              <li>Temukan kendaraan dari plat yang dimasukkan.</li>
              <li>Periksa waktu mulai dan selesai perjalanan.</li>
              <li>Tampilkan kandidat untuk pemeriksaan operator.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
