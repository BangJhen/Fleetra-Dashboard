"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { statusLabel } from "@/lib/types";
import { Icon } from "./icons";
export const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const time = (s: string) =>
  new Date(s).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
export const date = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
export function Status({ status }: { status: string }) {
  const tone = ["moving", "completed", "confirmed"].includes(status)
    ? "success"
    : ["service", "disputed", "cancelled"].includes(status)
      ? "danger"
      : ["idle", "needs_review"].includes(status)
        ? "warning"
        : "blue";
  return (
    <Badge variant="outline" className={`status ${tone}`}>
      {statusLabel[status] || status}
    </Badge>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <Icon name="back" />
      {children}
    </Link>
  );
}
export function SectionHead({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="empty-state">
      <EmptyHeader>
        <EmptyMedia>
          <Icon name="search" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function Initials({ name }: { name: string }) {
  return (
    <span className="avatar">
      {name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
export function ExportButton({
  rows,
  filename = "fleetra-export",
}: {
  rows: (string | number)[][];
  filename?: string;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const csv = rows
          .map((r) =>
            r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
          )
          .join("\n");
        const url = URL.createObjectURL(
          new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = filename + ".csv";
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Icon name="download" />
      Ekspor data
    </Button>
  );
}

export function PaginationControls({
  count,
  page,
  pageSize,
  onPage,
  compact = false,
}: {
  count: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  compact?: boolean;
}) {
  if (count === 0) return null;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, count);

  return (
    <div className={`table-footer pagination-controls ${compact ? "compact" : ""}`}>
      <span className="pagination-info">
        {compact ? `${start}–${end} dari ${count}` : `${start} sampai ${end} dari ${count}`}
      </span>
      <div className="inline-controls">
        <Button
          variant="outline"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
          className="h-7 text-xs px-2.5"
        >
          Sebelumnya
        </Button>
        <span className="pagination-page-label">
          {compact ? `${current} / ${pages}` : `Halaman ${current} dari ${pages}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={current >= pages}
          onClick={() => onPage(current + 1)}
          className="h-7 text-xs px-2.5"
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
