import { redirect } from "next/navigation";
import { sessionUserId } from "@/lib/auth";
import { dashboardState } from "@/lib/dashboard-state";
import { FleetProvider } from "@/components/dashboard/provider";
import { Shell } from "@/components/dashboard/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await sessionUserId();
  if (!userId) redirect("/login");
  const initial = await dashboardState(userId);
  return (
    <FleetProvider initial={initial}>
      <Shell>{children}</Shell>
    </FleetProvider>
  );
}
