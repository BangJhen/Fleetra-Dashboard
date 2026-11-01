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
      <span className="status-dot" />
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
      <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
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
export function DemoNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="demo-note">
      <span className="demo-square" />
      {children ||
        "Data simulasi MVP. Tidak terhubung ke sensor atau layanan produksi."}
    </p>
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
