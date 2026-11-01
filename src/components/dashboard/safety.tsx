"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  PageHeading,
  DemoNote,
  Status,
  Initials,
  BackLink,
  EmptyState,
} from "./common";
import { Icon } from "./icons";
export function Safety() {
  const data = useFleet((s) => s.data);
  const [query, setQuery] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(true);
  const average =
    data.vehicles.reduce((n, v) => n + v.health, 0) /
    Math.max(1, data.vehicles.length);
  const vehicles = data.vehicles.filter(
    (v) =>
      (!onlyRisk || v.status === "service") &&
      v.plate.toLowerCase().includes(query.toLowerCase()),
  );
  const drivers = data.drivers
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    .toSorted((a, b) => b.score - a.score);
  return (
    <div className="page">
      <PageHeading
        title="Health & safety"
        description="Kenali risiko lebih awal. Jaga armada dan pengemudi tetap siap."
      />
      <Tabs defaultValue="health" onValueChange={() => setQuery("")}>
        <TabsList className="page-tabs">
          <TabsTrigger value="health">Kesehatan armada</TabsTrigger>
          <TabsTrigger value="drivers">Keselamatan pengemudi</TabsTrigger>
        </TabsList>
        <TabsContent value="health">
          <div className="health-overview">
            <div className="health-score">
              <div>
                <span>Indeks kondisi armada</span>
                <strong>
                  {average.toFixed(1)}
                  <small>/ 100</small>
                </strong>
                <p>Rata-rata skor kondisi dari {data.vehicles.length} unit.</p>
              </div>
              <div
                className="score-ring"
                style={
                  { "--progress": `${average * 3.6}deg` } as React.CSSProperties
                }
              >
                <span>{Math.round(average)}</span>
              </div>
            </div>
            <div className="health-callout">
              <span className="status-dot" />
              <div>
                <strong>
                  {data.vehicles.filter((v) => v.status === "service").length}{" "}
                  armada memerlukan pemeriksaan
                </strong>
                <p>
                  Estimasi kampas rem di bawah 30 persen. Armada ini tidak
                  tersedia untuk penugasan baru.
                </p>
                <small>
                  Indikator simulasi, bukan diagnosis teknis tersertifikasi.
                </small>
              </div>
            </div>
          </div>
          <section className="content-panel">
            <div className="table-toolbar">
              <div>
                <h2>
                  {onlyRisk
                    ? "Prioritas pemeriksaan"
                    : "Kondisi seluruh armada"}
                </h2>
                <p className="muted">
                  Periksa kondisi fisik sebelum mengambil tindakan.
                </p>
              </div>
              <div className="inline-controls">
                <Button
                  variant="outline"
                  onClick={() => setOnlyRisk((v) => !v)}
                >
                  {onlyRisk ? "Lihat semua armada" : "Hanya prioritas"}
                </Button>
                <Input
                  className="compact-input"
                  aria-label="Cari armada"
                  placeholder="Cari plat kendaraan"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Armada</TableHead>
                  <TableHead>Estimasi kampas rem</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Indeks kondisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <strong>{v.plate}</strong>
                      <small className="table-secondary">{v.model}</small>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`brake-estimate ${v.brake < 30 ? "risk" : ""}`}
                      >
                        <span>{v.brake}%</span>
                        <div>
                          <i style={{ width: `${v.brake}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.odometer.toLocaleString("id-ID")} km
                    </TableCell>
                    <TableCell>{v.health} / 100</TableCell>
                    <TableCell>
                      <Status status={v.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" asChild>
                        <Link href={`/dashboard/safety/vehicles/${v.id}`}>
                          Lihat kondisi
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {vehicles.length === 0 && (
              <EmptyState
                title="Armada tidak ditemukan"
                description="Ubah pencarian plat kendaraan."
              />
            )}
          </section>
        </TabsContent>
        <TabsContent value="drivers">
          <div className="safety-driver-summary">
            <div>
              <span>Rata-rata safety score</span>
              <strong>
                {(
                  data.drivers.reduce((n, d) => n + d.score, 0) /
                  data.drivers.length
                ).toFixed(1)}
                <small>/ 100</small>
              </strong>
            </div>
            <p>
              Skor dan kejadian pada halaman ini merupakan seed simulasi untuk
              demonstrasi evaluasi keselamatan.
            </p>
          </div>
          <section className="content-panel">
            <div className="table-toolbar">
              <div>
                <h2>Peringkat keselamatan pengemudi</h2>
                <p className="muted">Diurutkan berdasarkan skor tertinggi.</p>
              </div>
              <Input
                className="compact-input"
                aria-label="Cari pengemudi"
                placeholder="Cari nama pengemudi"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Pengemudi</TableHead>
                  <TableHead>Perjalanan</TableHead>
                  <TableHead>Pengereman keras</TableHead>
                  <TableHead>Melebihi kecepatan</TableHead>
                  <TableHead>Safety score</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d, i) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <span className="rank">{i + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div className="person-cell">
                        <Initials name={d.name} />
                        <strong>{d.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>{d.trips}</TableCell>
                    <TableCell>{d.braking} kejadian</TableCell>
                    <TableCell>{d.speeding} kejadian</TableCell>
                    <TableCell>
                      <strong className={d.score > 85 ? "good-score" : "muted"}>
                        {d.score}
                      </strong>
                      <span className="muted"> / 100</span>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          aria-label={`Detail ${d.name}`}
                          href={`/dashboard/safety/drivers/${d.id}`}
                        >
                          <Icon name="chevron" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {drivers.length === 0 && (
              <EmptyState
                title="Pengemudi tidak ditemukan"
                description="Coba nama pengemudi lain."
              />
            )}
          </section>
        </TabsContent>
      </Tabs>
      <DemoNote>
        Indeks kondisi adalah rata-rata snapshot seed. Skor pengemudi dan
        estimasi rem belum dihitung dari sensor.
      </DemoNote>
    </div>
  );
}
export function SafetyDetail({
  kind,
  id,
}: {
  kind: "vehicles" | "drivers";
  id: string;
}) {
  const data = useFleet((s) => s.data);
  const v = data.vehicles.find((v) => v.id === id);
  const d = data.drivers.find((d) => d.id === id);
  if ((kind === "vehicles" && !v) || (kind === "drivers" && !d))
    return (
      <div className="page">
        <BackLink href="/dashboard/safety">Kembali ke health & safety</BackLink>
        <EmptyState
          title="Data tidak ditemukan"
          description="Pilih armada atau pengemudi dari daftar yang tersedia."
        />
      </div>
    );
  return (
    <div className="page">
      <BackLink href="/dashboard/safety">Kembali ke health & safety</BackLink>
      <PageHeading
        title={kind === "vehicles" ? v!.plate : d!.name}
        description={
          kind === "vehicles"
            ? v!.model
            : "Profil keselamatan pengemudi / Data simulasi"
        }
      >
        {kind === "vehicles" && <Status status={v!.status} />}
      </PageHeading>
      <section className="detail-facts content-panel">
        {(kind === "vehicles"
          ? [
              ["Indeks kondisi", `${v!.health} / 100`],
              ["Estimasi kampas rem", `${v!.brake} persen`],
              ["Bahan bakar", `${v!.fuel} persen`],
              ["Odometer", `${v!.odometer.toLocaleString("id-ID")} km`],
            ]
          : [
              ["Safety score", `${d!.score} / 100`],
              ["Total perjalanan", d!.trips],
              ["Pengereman keras", `${d!.braking} kejadian`],
              ["Melebihi kecepatan", `${d!.speeding} kejadian`],
            ]
        ).map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="content-panel detail-explanation">
        <h2>
          {kind === "vehicles" ? "Catatan pemeriksaan" : "Catatan evaluasi"}
        </h2>
        <p>
          {kind === "vehicles"
            ? v!.brake < 30
              ? "Estimasi kampas rem berada di bawah ambang demo 30 persen. Armada ditandai memerlukan servis dan diblokir dari penugasan baru. Lakukan pemeriksaan fisik oleh teknisi."
              : "Tidak ada peringatan kritis pada snapshot demo ini. Tetap lakukan pemeriksaan rutin sebelum perjalanan."
            : "Skor ini berasal dari seed demo. Rincian waktu dan lokasi insiden belum tersedia; sistem tidak mengarang riwayat kejadian."}
        </p>
        <DemoNote>
          Kondisi dan skor adalah estimasi simulasi. Data ini bukan sertifikasi
          keselamatan.
        </DemoNote>
      </section>
    </div>
  );
}
