"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleet } from "./provider";
import { PageHeading, EmptyState, date, time } from "./common";
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
          <Icon name="checkAll" />
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
                  {n.status === "unread" && (
                    <span className="notice-new-label">Baru</span>
                  )}
                </div>
                <p>{n.description}</p>
                <small>
                  {date(n.at)} pukul {time(n.at)}
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
    </div>
  );
}
