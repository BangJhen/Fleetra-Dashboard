import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getState } from "@/lib/store";
import { FleetProvider } from "@/components/dashboard/provider";
import { Shell } from "@/components/dashboard/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/login");
  const initial = await getState();
  return (
    <FleetProvider initial={initial}>
      <Shell>{children}</Shell>
    </FleetProvider>
  );
}
