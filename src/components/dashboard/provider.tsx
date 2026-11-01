"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStore, useStore } from "zustand";
import { toast } from "sonner";
import type { FleetState } from "@/lib/types";
type State = {
  data: FleetState;
  online: boolean;
  refreshed: string;
  refresh: () => Promise<void>;
  mutate: (body: Record<string, unknown>) => Promise<{ id?: string }>;
};
type Store = ReturnType<typeof makeStore>;
function makeStore(initial: FleetState, onExpired: () => void) {
  return createStore<State>((set, get) => ({
    data: initial,
    online: true,
    refreshed: initial.updatedAt,
    refresh: async () => {
      try {
        const res = await fetch("/api/fleet", { cache: "no-store" });
        if (res.status === 401) {
          onExpired();
          return;
        }
        if (!res.ok) throw Error("Pembaruan data tidak tersedia");
        set({
          data: await res.json(),
          online: true,
          refreshed: new Date().toISOString(),
        });
      } catch {
        set({ online: false });
      }
    },
    mutate: async (body) => {
      try {
        const res = await fetch("/api/fleet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 401) onExpired();
        const result = await res.json();
        if (!res.ok) throw Error(result.error || "Perubahan gagal disimpan.");
        await get().refresh();
        return result;
      } catch (e) {
        const error =
          e instanceof Error ? e.message : "Periksa koneksi lalu coba kembali.";
        toast.error(error);
        throw e;
      }
    },
  }));
}
const Context = createContext<Store | null>(null);
export function FleetProvider({
  initial,
  children,
}: {
  initial: FleetState;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [store] = useState(() =>
    makeStore(initial, () => router.replace("/login")),
  );
  useEffect(() => {
    const refresh = () => store.getState().refresh();
    const interval = setInterval(refresh, 15000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useFleet<T>(selector: (s: State) => T) {
  const store = useContext(Context);
  if (!store) throw Error("FleetProvider tidak ditemukan");
  return useStore(store, selector);
}
