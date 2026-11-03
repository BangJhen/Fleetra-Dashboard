"use client";

import React from "react";
import { Search, Inbox } from "lucide-react";

export interface TableEmptyStateProps {
  colSpan?: number;
  title?: string;
  description?: string;
  icon?: "search" | "empty";
  customIcon?: React.ReactNode;
  action?: React.ReactNode;
  inTable?: boolean;
}

export function TableEmptyState({
  colSpan = 6,
  title = "Data tidak ditemukan",
  description = "Belum ada rekaman data yang cocok untuk ditampilkan.",
  icon = "empty",
  customIcon,
  action,
  inTable = true,
}: TableEmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-3 flex items-center justify-center">
        {customIcon ? (
          customIcon
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            {icon === "search" ? (
              <Search className="h-6 w-6" />
            ) : (
              <Inbox className="h-6 w-6" />
            )}
          </div>
        )}
        <div className="absolute inset-0 rounded-full border border-blue-100 animate-ping opacity-25 pointer-events-none" />
      </div>

      <div className="max-w-xs space-y-1 px-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  if (inTable) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

export default TableEmptyState;
