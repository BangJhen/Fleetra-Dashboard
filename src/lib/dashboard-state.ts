import "server-only";
import { getState } from "./store";
import { getRegisteredProfile } from "./accounts";
export async function dashboardState(userId: string) {
  const state = await getState();
  if (userId === "demo")
    return {
      ...state,
      operatorProfile: { ...state.operatorProfile, isDemo: true },
    };
  const profile = await getRegisteredProfile(userId);
  if (!profile) throw Error("Akun tidak ditemukan.");
  return { ...state, operatorProfile: { ...profile, isDemo: false } };
}
