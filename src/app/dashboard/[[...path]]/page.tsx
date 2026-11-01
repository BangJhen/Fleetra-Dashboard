import { notFound, redirect } from "next/navigation";
import { Tracking } from "@/components/dashboard/tracking";
import { Dispatch } from "@/components/dashboard/dispatch";
import { Planner } from "@/components/dashboard/planner";
import { TripDetail } from "@/components/dashboard/trip-detail";
import { Safety, SafetyDetail } from "@/components/dashboard/safety";
import { Rto } from "@/components/dashboard/finance";
import { Etle } from "@/components/dashboard/etle";
import { Management } from "@/components/dashboard/management";
import { Notifications } from "@/components/dashboard/support";
import { Profile } from "@/components/dashboard/profile";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const [first, second, third] = path;
  if (path.length === 0) return <Tracking />;
  if (first === "dispatch") {
    if (path.length === 1) return <Dispatch />;
    if (path.length === 2)
      return second === "new" ? <Planner /> : <TripDetail id={second} />;
  }
  if (first === "safety") {
    if (path.length === 1) return <Safety />;
    if (path.length === 3 && ["vehicles", "drivers"].includes(second))
      return (
        <SafetyDetail kind={second as "vehicles" | "drivers"} id={third} />
      );
  }
  if (first === "finance" && path.length <= 3) {
    if (second === "rto") return <Rto id={third} />;
    if (second === "etle") return <Etle id={third} />;
  }
  if (
    first === "management" &&
    path.length === 2 &&
    ["vehicles", "drivers"].includes(second)
  )
    return <Management kind={second as "vehicles" | "drivers"} />;
  if (first === "notifications" && path.length === 1) return <Notifications />;
  if (first === "settings" && path.length === 1) redirect("/dashboard/profile");
  if (first === "profile" && path.length === 1) return <Profile />;
  notFound();
}
