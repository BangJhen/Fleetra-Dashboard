"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
export const FleetMap = dynamic(() => import("./fleet-map"), {
  ssr: false,
  loading: () => <Skeleton className="map-skeleton" />,
});
