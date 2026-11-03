"use client";
import { useState, useEffect } from "react";
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
import { MoreHorizontal } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { NotificationPopover } from "./notification-popover";
const nav: { label: string; href: string; icon: IconName; sub?: boolean }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "speed" },
  { label: "Live tracking", href: "/dashboard/tracking", icon: "tracking" },
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
export function Brand({
  sidebar = false,
  collapsed = false,
}: {
  sidebar?: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="brand brand-collapsed">
        <Image
          src="/logo-fleetra-mark.png"
          alt="FLEETRA"
          width={32}
          height={32}
          priority
          className="brand-mark-img"
          style={{ width: "28px", height: "28px", objectFit: "contain" }}
        />
      </div>
    );
  }
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fleetra_sidebar_collapsed");
      if (stored !== null) setCollapsed(stored === "true");
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fleetra_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

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
  const renderSidebarContent = (isSheet = false) => {
    const isCol = !isSheet && collapsed;
    return (
      <div className={cn("sidebar-content", isCol && "is-collapsed")}>
        <div className={cn("sidebar-header", isCol && "is-collapsed")}>
          <Link
            href="/dashboard"
            aria-label="FLEETRA beranda"
            onClick={() => setOpen(false)}
            className="sidebar-brand-link"
          >
            <Brand sidebar collapsed={isCol} />
          </Link>
        </div>

        {!isCol && <div className="nav-section-label">Operasional</div>}
        <nav aria-label="Navigasi utama" className="w-full">
          {nav.map((n, i) => {
            const isActive =
              n.href === "/dashboard"
                ? pathname === n.href
                : pathname.startsWith(n.href);
            const count =
              n.href === "/dashboard/dispatch"
                ? data.trips.filter((t) => t.status === "assigned").length
                : 0;

            return (
              <div key={n.href}>
                {n.sub && !nav[i - 1]?.sub && (
                  isCol ? (
                    <div className="py-2 flex justify-center" aria-hidden="true">
                      <MoreHorizontal className="h-4 w-4 text-slate-300" />
                    </div>
                  ) : (
                    <div className="nav-section-label management-label">
                      Manajemen
                    </div>
                  )
                )}

                {isCol ? (
                  <Tooltip content={n.label} direction="right">
                    <Link
                      onClick={() => setOpen(false)}
                      href={n.href}
                      className={cn(
                        "nav-item nav-item-collapsed",
                        isActive && "active",
                      )}
                      aria-label={n.label}
                    >
                      <Icon name={n.icon} />
                      {count > 0 && <span className="nav-count-dot" />}
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    onClick={() => setOpen(false)}
                    href={n.href}
                    className={cn("nav-item", isActive && "active")}
                  >
                    <Icon name={n.icon} />
                    <span>{n.label}</span>
                    {count > 0 && <span className="nav-count">{count}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {isCol ? (
            <Tooltip content={`${profile.name} (${profile.email})`} direction="right">
              <Link
                className="profile-button profile-button-collapsed"
                href="/dashboard/profile"
                aria-label={`Profil ${profile.name}`}
                onClick={() => setOpen(false)}
              >
                <span className="profile-avatar">{initials}</span>
              </Link>
            </Tooltip>
          ) : (
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
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("app-shell", collapsed && "is-collapsed")}>
      <aside className={cn("sidebar", collapsed && "is-collapsed")}>
        {renderSidebarContent(false)}
      </aside>
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
                {renderSidebarContent(true)}
              </SheetContent>
            </Sheet>
            <button
              type="button"
              className="desktop-menu-toggle"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
              title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            >
              <Icon name="menu" />
            </button>
            <div className="topbar-page-context">
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
            <NotificationPopover />
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
