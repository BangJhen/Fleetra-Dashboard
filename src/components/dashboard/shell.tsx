"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
const nav: { label: string; href: string; icon: IconName; sub?: boolean }[] = [
  { label: "Live tracking", href: "/dashboard", icon: "tracking" },
  { label: "Dispatch & trips", href: "/dashboard/dispatch", icon: "dispatch" },
  { label: "Health & safety", href: "/dashboard/safety", icon: "safety" },
  { label: "RTO & ekuitas", href: "/dashboard/finance/rto", icon: "finance" },
  {
    label: "Rekonsiliasi ETLE",
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
export function Brand() {
  return (
    <div className="brand">
      <Image
        src="/logo-fleetra.png"
        alt="FLEETRA"
        width={154}
        height={154}
        priority
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
  const router = useRouter();
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
        <Brand />
      </Link>
      <div className="workspace-switch">
        <span className="workspace-avatar">F</span>
        <div>
          <strong>FLEETRA Operations</strong>
          <small>Bandung Raya</small>
        </div>
        <span className="workspace-tag">MVP</span>
      </div>
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
        <div className="demo-sidebar">
          <div>
            <span className="small-square" />
            Workspace demo
          </div>
          <p>Jelajahi operasional armada dengan data simulasi.</p>
        </div>
        <Link
          className={cn(
            "nav-item",
            pathname === "/dashboard/settings" && "active",
          )}
          href="/dashboard/settings"
        >
          <Icon name="settings" />
          Pengaturan
        </Link>
        <button
          className="profile-button"
          onClick={() => router.push("/dashboard/settings")}
        >
          <span className="profile-avatar">FM</span>
          <span>
            <strong>Fleet Manager</strong>
            <small>manager@fleetra.demo</small>
          </span>
          <Icon name="chevron" />
        </button>
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
            <span className="breadcrumb-root">Workspace</span>
            <Icon name="chevron" />
            <span className="breadcrumb-current">
              {selected?.label ||
                (pathname.includes("notifications")
                  ? "Notifikasi"
                  : "Pengaturan")}
            </span>
          </div>
          <div className="topbar-right">
            <button
              className={cn("sync-status", !online && "offline")}
              onClick={() => refresh()}
            >
              <span />
              {online ? "Data tersinkron" : "Koneksi terputus"}
            </button>
            <span className="topbar-divider" />
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
              href="/dashboard/settings"
              className="top-avatar"
              aria-label="Akun Fleet Manager"
            >
              FM
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
        <footer className="app-footer">
          <span>FLEETRA Fleet Management</span>
          <span>Prototipe ADIKARA 2026</span>
        </footer>
      </div>
    </div>
  );
}
