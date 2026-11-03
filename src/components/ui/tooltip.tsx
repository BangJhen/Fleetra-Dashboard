"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  direction?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  delay = 150,
  direction = "top",
  className = "",
}: TooltipProps) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setActive(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current!);
    setActive(false);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current!);
    };
  }, []);

  if (!content) return <>{children}</>;

  const directionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[direction];

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent",
  }[direction];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {active && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-white shadow-md transition-opacity animate-in fade-in zoom-in-95 pointer-events-none",
            directionClasses,
            className,
          )}
        >
          {content}
          <span
            className={cn("absolute border-4", arrowClasses)}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
