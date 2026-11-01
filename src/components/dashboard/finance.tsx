"use client";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useFleet } from "./provider";
import {
  BackLink,
  PageHeading,
  DemoNote,
  Initials,
  money,
  date,
  EmptyState,
} from "./common";
import { Icon } from "./icons";
export function Rto({ id }: { id?: string }) {
  const data = useFleet((s) => s.data);
  const [query, setQuery] = useState("");
  const balance = (cid: string, opening: number) =>
    opening +
    data.ledger
      .filter((l) => l.contractId === cid)
      .reduce((n, l) => n + l.amount, 0);
  const contracts = data.contracts.filter((c) =>
    data.drivers
      .find((d) => d.id === c.driverId)
      ?.name.toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (id) {
    const c = data.contracts.find((c) => c.id === id);
    if (!c)
      return (
        <div className="page">
          <BackLink href="/dashboard/finance/rto">Kembali ke kontrak</BackLink>
          <EmptyState
            title="Kontrak tidak ditemukan"
            description="Pilih kontrak dari daftar RTO."
          />
        </div>
      );
    const d = data.drivers.find((d) => d.id === c.driverId);
    const v = data.vehicles.find((v) => v.id === c.vehicleId);
    const paid = balance(c.id, c.openingBalance);
    const percent = (paid / c.total) * 100;
    const ledger = data.ledger.filter((l) => l.contractId === c.id);
    return (
      <div className="page">
        <BackLink href="/dashboard/finance/rto">
          Kembali ke kontrak RTO
        </BackLink>
        <PageHeading
          title={`Kontrak ${c.id.toUpperCase()}`}
          description={`${d?.name} / ${v?.plate}`}
        />
        <div className="rto-detail-grid">
          <section className="content-panel equity-panel">
            <h2>Ekuitas kepemilikan</h2>
            <strong className="equity-percent">
              {percent.toFixed(1)}
              <small>persen</small>
            </strong>
            <div className="equity-bar">
              <i style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
            <div className="equity-values">
              <div>
                <span>Akumulasi simulasi</span>
                <strong>{money(paid)}</strong>
              </div>
              <div>
                <span>Nilai kontrak</span>
                <strong>{money(c.total)}</strong>
              </div>
            </div>
            <DemoNote>
              Saldo awal berasal dari seed. Belum ada perpindahan dana.
            </DemoNote>
          </section>
          <section className="content-panel contract-panel">
            <h2>Ringkasan kemitraan</h2>
            <dl className="review-details">
              <div>
                <dt>Mitra pengemudi</dt>
                <dd>{d?.name}</dd>
              </div>
              <div>
                <dt>Kendaraan</dt>
                <dd>{v?.plate}</dd>
              </div>
              <div>
                <dt>Tenor kontrak</dt>
                <dd>{c.months} bulan</dd>
              </div>
              <div>
                <dt>Periode demo</dt>
                <dd>Bulan ke-{c.elapsed}</dd>
              </div>
              <div>
                <dt>Sisa kewajiban</dt>
                <dd>{money(Math.max(0, c.total - paid))}</dd>
              </div>
            </dl>
          </section>
        </div>
        <section className="content-panel">
          <div className="section-heading">
            <div>
              <h2>Ledger setoran simulasi</h2>
              <p>Setiap setoran dapat ditelusuri ke sumbernya.</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Saldo pembukaan</TableCell>
                <TableCell>SEED-OPENING</TableCell>
                <TableCell>Saldo awal simulasi, bukan transaksi bank</TableCell>
                <TableCell>{money(c.openingBalance)}</TableCell>
              </TableRow>
              {ledger.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{date(l.at)}</TableCell>
                  <TableCell>
                    <Link
                      className="table-primary-link"
                      href={`/dashboard/dispatch/${l.tripId}`}
                    >
                      {data.trips.find((t) => t.id === l.tripId)?.code}
                    </Link>
                  </TableCell>
                  <TableCell>Setoran perjalanan simulasi</TableCell>
                  <TableCell>{money(l.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {ledger.length === 0 && (
            <div className="ledger-note">
              Belum ada setoran per trip yang tercatat pada ledger.
            </div>
          )}
        </section>
        <DemoNote>
          Modul RTO adalah simulasi ledger dan ekuitas. Tidak terhubung ke bank
          atau escrow.
        </DemoNote>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeading
        title="RTO & ekuitas"
        description="Pantau langkah setiap mitra menuju kepemilikan armada."
      />
      <div className="finance-overview">
        <div>
          <span>Kontrak aktif</span>
          <strong>
            {data.contracts.length}
            <small>kemitraan</small>
          </strong>
        </div>
        <div>
          <span>Akumulasi ekuitas simulasi</span>
          <strong>
            {money(
              data.contracts.reduce(
                (n, c) => n + balance(c.id, c.openingBalance),
                0,
              ),
            )}
          </strong>
        </div>
        <div>
          <span>Total nilai kontrak</span>
          <strong>
            {money(data.contracts.reduce((n, c) => n + c.total, 0))}
          </strong>
        </div>
      </div>
      <section className="content-panel">
        <div className="table-toolbar">
          <div>
            <h2>Kontrak kemitraan</h2>
            <p className="muted">
              Ekuitas berasal dari saldo awal dan ledger yang tercatat.
            </p>
          </div>
          <Input
            className="compact-input"
            aria-label="Cari mitra RTO"
            placeholder="Cari nama mitra"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="contract-list">
          {contracts.map((c) => {
            const d = data.drivers.find((d) => d.id === c.driverId);
            const v = data.vehicles.find((v) => v.id === c.vehicleId);
            const paid = balance(c.id, c.openingBalance);
            return (
              <Link
                className="contract-row"
                href={`/dashboard/finance/rto/${c.id}`}
                key={c.id}
              >
                <div className="person-cell">
                  <Initials name={d?.name || "Mitra"} />
                  <div>
                    <strong>{d?.name}</strong>
                    <small>
                      {v?.plate} / {v?.model}
                    </small>
                  </div>
                </div>
                <div className="contract-equity">
                  <div>
                    <span>Ekuitas kepemilikan</span>
                    <strong>{((paid / c.total) * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="equity-bar">
                    <i style={{ width: `${(paid / c.total) * 100}%` }} />
                  </div>
                  <small>
                    {money(paid)} dari {money(c.total)}
                  </small>
                </div>
                <div className="contract-tenure">
                  <span>Tenor berjalan</span>
                  <strong>
                    {c.elapsed} <small>/ {c.months} bulan</small>
                  </strong>
                </div>
                <Icon name="chevron" />
              </Link>
            );
          })}
        </div>
        {contracts.length === 0 && (
          <EmptyState
            title="Kontrak tidak ditemukan"
            description="Ubah pencarian nama mitra."
          />
        )}
      </section>
      <DemoNote>
        RTO merupakan simulasi pay-per-trip dan ekuitas. Tidak ada transfer bank
        atau escrow nyata.
      </DemoNote>
    </div>
  );
}
