"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleet } from "./provider";
import {
  PageHeading,
  DemoNote,
  EmptyState,
  Initials,
  date,
  time,
} from "./common";
import { Icon } from "./icons";
export function Notifications() {
  const data = useFleet((s) => s.data);
  const mutate = useFleet((s) => s.mutate);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const notices = data.notices.filter(
    (n) =>
      filter === "all" ||
      (filter === "unread" ? n.status === "unread" : n.kind === "sos"),
  );
  async function update(id: string, status: string) {
    setBusy(id);
    try {
      await mutate({ action: "notice", id, status });
      toast.success("Status notifikasi diperbarui.");
    } catch {
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="page">
      <PageHeading
        title="Notifikasi"
        description="Perubahan perjalanan dan peringatan yang perlu Anda ketahui."
      >
        <Button
          variant="outline"
          disabled={!!busy}
          onClick={async () => {
            setBusy("all");
            try {
              await mutate({ action: "read-all" });
              toast.success("Notifikasi ditandai dibaca.");
            } catch {
            } finally {
              setBusy(null);
            }
          }}
        >
          <Icon name="check" />
          Tandai semua dibaca
        </Button>
      </PageHeading>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="page-tabs">
          <TabsTrigger value="all">Semua notifikasi</TabsTrigger>
          <TabsTrigger value="unread">Belum dibaca</TabsTrigger>
          <TabsTrigger value="sos">Emergency SOS</TabsTrigger>
        </TabsList>
      </Tabs>
      <section className="content-panel notification-list">
        {notices.length === 0 ? (
          <EmptyState
            title={
              filter === "sos" ? "Tidak ada alert SOS" : "Tidak ada notifikasi"
            }
            description={
              filter === "sos"
                ? "Alert dari Mobile akan tampil setelah integrasi API tersedia."
                : "Semua pembaruan sudah Anda tinjau."
            }
          />
        ) : (
          notices.map((n) => (
            <article
              key={n.id}
              className={`notice-row ${n.status === "unread" ? "unread" : ""}`}
            >
              <div className={`notice-icon ${n.kind}`}>
                <Icon
                  name={
                    n.kind === "health"
                      ? "safety"
                      : n.kind === "sos"
                        ? "locate"
                        : "dispatch"
                  }
                />
              </div>
              <div className="notice-content">
                <div>
                  <h2>{n.title}</h2>
                  {n.status === "unread" && <span className="unread-dot" />}
                </div>
                <p>{n.description}</p>
                <small>
                  {date(n.at)} / {time(n.at)}
                </small>
                <div className="notice-actions">
                  <Button variant="link" asChild>
                    <Link href={n.href}>
                      Lihat detail
                      <Icon name="arrow" />
                    </Link>
                  </Button>
                  {n.kind === "sos" && n.status !== "resolved" ? (
                    <Button
                      size="sm"
                      disabled={busy === n.id}
                      onClick={() =>
                        update(
                          n.id,
                          n.status === "acknowledged"
                            ? "resolved"
                            : "acknowledged",
                        )
                      }
                    >
                      {n.status === "acknowledged"
                        ? "Tutup kasus"
                        : "Akui alert"}
                    </Button>
                  ) : (
                    n.status === "unread" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy === n.id}
                        onClick={() => update(n.id, "read")}
                      >
                        Tandai dibaca
                      </Button>
                    )
                  )}
                  {n.kind === "sos" && n.status === "resolved" && (
                    <small>Kasus ditutup operator</small>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
      <DemoNote>
        SOS belum terhubung ke Mobile. Tidak ada pengiriman petugas atau
        panggilan darurat otomatis.
      </DemoNote>
    </div>
  );
}
export function Settings() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth", { method: "DELETE" });
      if (!res.ok) throw Error();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Tidak dapat keluar. Coba lagi.");
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <PageHeading
        title="Pengaturan akun"
        description="Informasi akses dan preferensi workspace Anda."
      />
      <section className="content-panel settings-panel">
        <div className="section-heading">
          <h2>Profil operator</h2>
        </div>
        <div className="settings-profile">
          <Initials name="Fleet Manager" />
          <div>
            <h3>Fleet Manager</h3>
            <p>manager@fleetra.demo</p>
          </div>
        </div>
        <dl className="review-details">
          <div>
            <dt>Peran aktif</dt>
            <dd>Fleet Manager / akun demo</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>FLEETRA Operations</dd>
          </div>
          <div>
            <dt>Wilayah operasi</dt>
            <dd>Bandung Raya</dd>
          </div>
          <div>
            <dt>Zona waktu</dt>
            <dd>Waktu Indonesia Barat (UTC+7)</dd>
          </div>
          <div>
            <dt>Tampilan</dt>
            <dd>Light mode</dd>
          </div>
          <div>
            <dt>Masa sesi</dt>
            <dd>8 jam setelah masuk</dd>
          </div>
        </dl>
        <DemoNote>
          Satu akun demo memiliki akses seluruh modul. RBAC produksi belum
          diaktifkan.
        </DemoNote>
        <Button variant="outline" onClick={logout} disabled={busy}>
          <Icon name="logout" />
          {busy ? "Keluar dari workspace" : "Keluar dari akun"}
        </Button>
      </section>
    </div>
  );
}
