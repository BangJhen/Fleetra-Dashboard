import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }> | React.ReactNode;
  iconColorClass?: string;
  iconBgClass?: string;
  centered?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: IconOrNode,
  iconColorClass = "text-blue-600",
  iconBgClass = "bg-blue-50 border-blue-100",
  centered = false,
  className,
  children,
}: PageHeaderProps) {
  const iconContent = React.isValidElement(IconOrNode)
    ? IconOrNode
    : IconOrNode
      ? React.createElement(
          IconOrNode as React.ComponentType<{ className?: string; size?: number }>,
          { className: iconColorClass, size: 20 },
        )
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between",
        centered && "text-center sm:text-left",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {!centered && iconContent && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              iconBgClass,
            )}
          >
            {iconContent}
          </div>
        )}

        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 leading-normal">{description}</p>
          )}
        </div>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export default PageHeader;
