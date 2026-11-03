"use client";

import React from "react";

export interface TableLoadingSkeletonProps {
  columns: number;
  rows?: number;
  asRowsOnly?: boolean;
}

const PRESET_WIDTHS = [
  [65, 45, 80, 50, 70],
  [55, 75, 40, 60, 50],
  [70, 50, 65, 45, 80],
  [45, 60, 75, 55, 40],
  [60, 70, 50, 65, 75],
];

export function TableLoadingSkeleton({
  columns,
  rows = 5,
  asRowsOnly = false,
}: TableLoadingSkeletonProps) {
  const rowCount = Math.min(20, Math.max(1, rows));

  const skeletonRows = Array.from({ length: rowCount }).map((_, rIdx) => {
    const widths = PRESET_WIDTHS[rIdx % PRESET_WIDTHS.length];
    return (
      <tr key={`skeleton-row-${rIdx}`} className="border-b border-slate-100">
        {Array.from({ length: columns }).map((_, cIdx) => {
          const isLast = cIdx === columns - 1;
          const widthPct = widths[cIdx % widths.length];

          return (
            <td key={`skeleton-col-${cIdx}`} className="p-3">
              {isLast ? (
                <div className="h-6 w-16 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 rounded-md ml-auto animate-pulse" />
              ) : (
                <div
                  className="h-4 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 rounded-md animate-pulse"
                  style={{ width: `${widthPct}%` }}
                />
              )}
            </td>
          );
        })}
      </tr>
    );
  });

  if (asRowsOnly) {
    return <>{skeletonRows}</>;
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-slate-100">{skeletonRows}</tbody>
      </table>
    </div>
  );
}

export default TableLoadingSkeleton;
