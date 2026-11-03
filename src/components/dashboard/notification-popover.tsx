"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useFleet } from "./provider";
import { Button } from "@/components/ui/button";
import { date, time } from "./common";
import { toast } from "sonner";
import { CheckCheck, ExternalLink, X } from "lucide-react";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "sos">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const data = useFleet((s) => s.data);
  const mutate = useFleet((s) => s.mutate);

  const unread = data.notices.filter((n) => n.status === "unread").length;
  const notices = data.notices.filter(
    (n) =>
      filter === "all" ||
      (filter === "unread" ? n.status === "unread" : n.kind === "sos"),
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function updateNotice(id: string, status: string) {
    setBusy(id);
    try {
      await mutate({ action: "notice", id, status });
      toast.success("Status notifikasi diperbarui.");
    } catch {
      toast.error("Gagal memperbarui notifikasi.");
    } finally {
      setBusy(null);
    }
  }

  async function markAllRead() {
    setBusy("all");
    try {
      await mutate({ action: "read-all" });
      toast.success("Semua notifikasi ditandai dibaca.");
    } catch {
      toast.error("Gagal memperbarui notifikasi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger (role link for accessibility & Playwright test compatibility) */}
      <a
        href="/dashboard/notifications"
        role="link"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="notification-button"
        aria-label={`Notifikasi, ${unread} belum dibaca`}
        aria-expanded={isOpen}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="notification-count">{unread}</span>}
      </a>

      {/* Notification Floating Card */}
      {isOpen && (
        <div className="notification-popover-card">
          {/* Card Header */}
          <div className="popover-header">
            <div className="flex items-center gap-2">
              <h2 className="popover-title">Notifikasi</h2>
              {unread > 0 && (
                <span className="popover-unread-badge">{unread} baru</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={busy === "all"}
                  className="popover-action-btn"
                  title="Tandai semua dibaca"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Tandai dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="popover-close-btn"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="popover-tabs">
            <button
              type="button"
              className={`popover-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Semua ({data.notices.length})
            </button>
            <button
              type="button"
              className={`popover-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Belum dibaca ({unread})
            </button>
            <button
              type="button"
              className={`popover-tab ${filter === "sos" ? "active" : ""}`}
              onClick={() => setFilter("sos")}
            >
              Emergency SOS
            </button>
          </div>

          {/* Notifications List */}
          <div className="popover-list">
            {notices.length === 0 ? (
              <div className="popover-empty">
                <div className="empty-icon-wrap">
                  <Icon name="bell" />
                </div>
                <p className="empty-title">Tidak ada notifikasi</p>
                <p className="empty-desc">
                  {filter === "sos"
                    ? "Tidak ada alert SOS yang aktif saat ini."
                    : "Semua pembaruan sudah Anda tinjau."}
                </p>
              </div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className={`popover-item ${n.status === "unread" ? "is-unread" : ""}`}
                >
                  <div className={`item-icon ${n.kind}`}>
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
                  <div className="item-body">
                    <div className="item-header">
                      <span className="item-title">{n.title}</span>
                      {n.status === "unread" && (
                        <span className="item-new-pill">Baru</span>
                      )}
                    </div>
                    <p className="item-desc">{n.description}</p>
                    <span className="item-time">
                      {date(n.at)} • {time(n.at)} WIB
                    </span>

                    {/* Quick Item Actions */}
                    <div className="item-actions">
                      {n.href && (
                        <Link
                          href={n.href}
                          className="item-link"
                          onClick={() => setIsOpen(false)}
                        >
                          Lihat detail
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {n.kind === "sos" && n.status !== "resolved" ? (
                        <Button
                          size="sm"
                          disabled={busy === n.id}
                          className="h-6 text-[10px] px-2"
                          onClick={() =>
                            updateNotice(
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
                      ) : n.kind === "sos" && n.status === "resolved" ? (
                        <span className="text-[10.5px] font-medium text-emerald-600">
                          Kasus ditutup operator
                        </span>
                      ) : n.status === "unread" ? (
                        <button
                          type="button"
                          onClick={() => updateNotice(n.id, "read")}
                          disabled={busy === n.id}
                          className="item-mark-read"
                        >
                          Tandai dibaca
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="popover-footer">
            <Link
              href="/dashboard/notifications"
              className="footer-link"
              onClick={() => setIsOpen(false)}
            >
              Buka halaman notifikasi penuh →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPopover;
