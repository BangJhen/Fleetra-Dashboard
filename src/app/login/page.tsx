import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/dashboard/login";
export default async function Page() {
  if (await isAuthenticated()) redirect("/dashboard");
  return <LoginForm />;
}
