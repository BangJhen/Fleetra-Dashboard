import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="page">
      <Skeleton className="loading-title" />
      <Skeleton className="loading-metrics" />
      <Skeleton className="loading-map" />
    </div>
  );
}
