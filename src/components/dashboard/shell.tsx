"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Icon, type IconName } from "./icons";
import { useFleet } from "./provider";
import { cn } from "@/lib/utils";
import { defaultOperatorProfile } from "@/lib/operator-profile";
const nav: { label: string; href: string; icon: IconName; sub?: boolean }[] = [
  { label: "Live tracking", href: "/dashboard", icon: "tracking" },
  {
    label: "Penugasan",
    href: "/dashboard/dispatch",
    icon: "dispatch",
  },
  { label: "Keselamatan armada", href: "/dashboard/safety", icon: "safety" },
  { label: "Sewa-Beli", href: "/dashboard/finance/rto", icon: "finance" },
  {
    label: "Tilang ETLE",
    href: "/dashboard/finance/etle",
    icon: "route",
  },
  {
    label: "Data armada",
    href: "/dashboard/management/vehicles",
    icon: "vehicles",
    sub: true,
  },
  {
    label: "Data pengemudi",
    href: "/dashboard/management/drivers",
    icon: "drivers",
    sub: true,
  },
];
export function Brand({ sidebar = false }: { sidebar?: boolean }) {
  return (
    <div className={sidebar ? "brand brand-sidebar" : "brand"}>
      <Image
        src="/logo-fleetra-text.png"
        alt="FLEETRA"
        width={1460}
        height={292}
        priority
        className="brand-img"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const data = useFleet((s) => s.data);
  const online = useFleet((s) => s.online);
  const refresh = useFleet((s) => s.refresh);
  const refreshed = useFleet((s) => s.refreshed);
  const [refreshing, setRefreshing] = useState(false);
  async function refreshData() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }
  const refreshedTime = new Date(refreshed)
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
    .replaceAll(".", ":");
  const profile = data.operatorProfile || defaultOperatorProfile;
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const unread = data.notices.filter((n) => n.status === "unread").length;
  const selected = nav.find((n) =>
    n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href),
  );
  const sidebar = (
    <div className="sidebar-content">
      <Link
        href="/dashboard"
        aria-label="FLEETRA beranda"
        onClick={() => setOpen(false)}
      >
        <Brand sidebar />
      </Link>
      <div className="nav-section-label">Operasional</div>
      <nav aria-label="Navigasi utama">
        {nav.map((n, i) => (
          <div key={n.href}>
            {i === 5 && (
              <div className="nav-section-label management-label">
                Manajemen
              </div>
            )}
            <Link
              onClick={() => setOpen(false)}
              href={n.href}
              className={cn(
                "nav-item",
                (n.href === "/dashboard"
                  ? pathname === n.href
                  : pathname.startsWith(n.href)) && "active",
              )}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.href === "/dashboard/dispatch" && (
                <span className="nav-count">
                  {data.trips.filter((t) => t.status === "assigned").length}
                </span>
              )}
            </Link>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link
          className="profile-button"
          href="/dashboard/profile"
          aria-label="Profil operator"
          aria-current={pathname === "/dashboard/profile" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <span className="profile-avatar">{initials}</span>
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.email}</small>
          </span>
          <Icon name="chevron" />
        </Link>
      </div>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mobile-menu"
                  aria-label="Buka navigasi"
                >
                  <Icon name="menu" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="mobile-sidebar">
                <SheetTitle className="sr-only">Navigasi FLEETRA</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <div className="topbar-page-context">
              <span className="topbar-workspace">{data.workspace.name}</span>
              <span className="breadcrumb-current">
                {selected?.label ||
                  (pathname.includes("notifications")
                    ? "Notifikasi"
                    : "Profil")}
              </span>
            </div>
            <span className="topbar-region">{data.workspace.region}</span>
          </div>
          <div className="topbar-right">
            <button
              className={cn("topbar-sync", !online && "is-offline")}
              onClick={refreshData}
              disabled={refreshing}
              aria-label="Perbarui data dashboard"
              title="Muat ulang data dashboard"
            >
              <span className="topbar-sync-icon">
                <Icon name={online ? "signal" : "refresh"} />
              </span>
              <span className="topbar-sync-copy">
                <strong>
                  {refreshing
                    ? "Memperbarui data"
                    : online
                      ? "Data tersinkron"
                      : "Koneksi terputus"}
                </strong>
                <small>
                  {refreshing
                    ? "Mohon tunggu"
                    : online
                      ? `Diperbarui ${refreshedTime} WIB`
                      : "Coba sambungkan kembali"}
                </small>
              </span>
            </button>
            <Link
              className="notification-button"
              href="/dashboard/notifications"
              aria-label={`Notifikasi, ${unread} belum dibaca`}
            >
              <Icon name="bell" />
              {unread > 0 && (
                <span className="notification-count">{unread}</span>
              )}
            </Link>
            <Link
              href="/dashboard/profile"
              className="topbar-account"
              aria-label="Buka profil"
            >
              <span className="topbar-account-avatar">{initials}</span>
              <span className="topbar-account-copy">
                <strong>{profile.name}</strong>
                <small>
                  {profile.isDemo === false ? "Akun operator" : "Akun demo"}
                </small>
              </span>
              <Icon name="chevron" />
            </Link>
          </div>
        </header>
        <main id="main-content">
          {!online && (
            <div className="connection-banner">
              Pembaruan data terhenti. Menampilkan data terakhir.{" "}
              <button onClick={() => refresh()}>Coba lagi</button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
