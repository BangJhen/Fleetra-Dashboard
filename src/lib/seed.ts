import { demoVehicleModels } from "./vehicle-types";
import { defaultOperatorProfile } from "./operator-profile";
import { ensureDemoEtle } from "./etle-demo";
import type { FleetState, Stop, Vehicle } from "./types";
export const defaultWorkspace = { name: "FLEETRA Operations", region: "Bandung Raya" };
export const locations = [
  {
    name: "Gudang Logistik Cimahi",
    address: "Jl. Industri, Cimahi Selatan",
    lat: -6.8953,
    lng: 107.5489,
  },
  {
    name: "Toko Sumber Rejeki",
    address: "Jl. Pasirkaliki, Bandung",
    lat: -6.9031,
    lng: 107.5968,
  },
  {
    name: "Ritel Prima Buah Batu",
    address: "Jl. Buah Batu, Bandung",
    lat: -6.9464,
    lng: 107.6349,
  },
  {
    name: "Hub Antapani",
    address: "Jl. Terusan Jakarta, Antapani",
    lat: -6.9148,
    lng: 107.6608,
  },
  {
    name: "Distribusi Dago",
    address: "Jl. Ir. H. Juanda, Dago",
    lat: -6.8839,
    lng: 107.6131,
  },
  {
    name: "Gudang Kopo",
    address: "Jl. Kopo, Babakan Ciparay",
    lat: -6.9508,
    lng: 107.5801,
  },
  {
    name: "Mitra Setiabudi",
    address: "Jl. Dr. Setiabudi, Bandung",
    lat: -6.8622,
    lng: 107.5947,
  },
  {
    name: "Hub Gedebage",
    address: "Jl. Soekarno Hatta, Gedebage",
    lat: -6.9444,
    lng: 107.6905,
  },
  {
    name: "Sentra Logistik Padalarang",
    address: "Jl. Raya Padalarang, Bandung Barat",
    lat: -6.8378,
    lng: 107.4789,
  },
  {
    name: "Hub Kargo Moh Toha",
    address: "Jl. Moh. Toha, Dayeuhkolot",
    lat: -6.9804,
    lng: 107.6186,
  },
  {
    name: "Depo Logistik Ujungberung",
    address: "Jl. A.H. Nasution, Ujungberung",
    lat: -6.9112,
    lng: 107.7015,
  },
  {
    name: "Terminal Logistik Cileunyi",
    address: "Jl. Raya Cileunyi, Bandung Timur",
    lat: -6.9387,
    lng: 107.7472,
  },
  {
    name: "Ritel Sentosa Pasirkoja",
    address: "Jl. Terusan Pasirkoja, Bojongloa Kaler",
    lat: -6.9312,
    lng: 107.5874,
  },
  {
    name: "Depo Farmasi Pasteur",
    address: "Jl. Dr. Djunjunan, Sukajadi",
    lat: -6.8924,
    lng: 107.5812,
  },
  {
    name: "Mitra Kargo Batununggal",
    address: "Jl. Batununggal Indah Raya, Bandung Kidul",
    lat: -6.9632,
    lng: 107.6253,
  },
  {
    name: "Hub Distribusi Soreang",
    address: "Jl. Raya Soreang, Kab. Bandung",
    lat: -7.0275,
    lng: 107.5218,
  },
  {
    name: "Toko Grosir Rajawali",
    address: "Jl. Rajawali Barat, Andir",
    lat: -6.9076,
    lng: 107.5683,
  },
  {
    name: "Depo Dingin Lembang",
    address: "Jl. Raya Lembang, Lembang",
    lat: -6.8189,
    lng: 107.6174,
  },
  {
    name: "Mitra Pangan Sukajadi",
    address: "Jl. Sukajadi, Sukasari",
    lat: -6.8778,
    lng: 107.5982,
  },
  {
    name: "Sentra Logistik Arcamanik",
    address: "Jl. Arcamanik Endah, Bandung Timur",
    lat: -6.9205,
    lng: 107.6784,
  },
];
const names = [
  "Budi Santoso",
  "Ahmad Fauzi",
  "Dedi Kurniawan",
  "Rizky Pratama",
  "Agus Setiawan",
  "Hendra Wijaya",
  "Dimas Saputra",
  "Yusuf Hidayat",
  "Eko Purnomo",
  "Fajar Ramadhan",
  "Andi Firmansyah",
  "Wahyu Nugroho",
];
export function createSeed(): FleetState {
  const now = new Date();
  const base = new Date(now);
  base.setHours(base.getHours() - 3, 0, 0, 0);
  const drivers = Array.from({ length: 142 }, (_, i) => ({
    id: `d${i + 1}`,
    name: i < 12 ? names[i] : `${names[i % 12]} ${Math.floor(i / 12) + 1}`,
    phone: "",
    score: i === 0 ? 94 : 72 + ((i * 7) % 28),
    trips: 42 + ((i * 13) % 230),
    braking: i % 5,
    speeding: i % 3,
  }));
  const vehicles: Vehicle[] = Array.from({ length: 142 }, (_, i) => {
    const p = locations[i % locations.length];
    return {
      id: `v${i + 1}`,
      plate:
        i === 0
          ? "B 9821 KCE"
          : `${i % 3 === 0 ? "B" : "D"} ${2100 + i * 17} ${["FTR", "KCE", "AFD", "BGT"][i % 4]}`,
      ...demoVehicleModels[i % demoVehicleModels.length],
      status: i < 88 ? "moving" : i < 120 ? "idle" : "service",
      driverId: `d${i + 1}`,
      lat: p.lat + Math.sin(i * 2.5) * 0.016,
      lng: p.lng + Math.cos(i * 2.5) * 0.019,
      heading: (i * 47) % 360,
      speed: i < 88 ? 24 + ((i * 7) % 38) : 0,
      fuel: i === 0 ? 74 : 32 + ((i * 11) % 65),
      brake: i >= 120 ? 12 + (i % 18) : 64 + (i % 34),
      odometer: 28500 + i * 407,
      health: i >= 120 ? 51 + (i % 16) : 88 + (i % 12),
      location: p.address,
    };
  });
  const trips = Array.from({ length: 10 }, (_, i) => {
    const status = i < 5 ? "in_progress" : i < 8 ? "assigned" : "completed";
    const start = new Date(base.getTime() + i * 60000).toISOString();
    return {
      id: `trip-${89 + i}`,
      code: `TRIP-2026-${String(89 + i).padStart(3, "0")}`,
      vehicleId: `v${i + 1}`,
      driverId: `d${i + 1}`,
      status: status as "in_progress" | "assigned" | "completed",
      stops: [0, 1, 2, 3, 4].map(
        (n) =>
          ({
            ...locations[n],
            id: `stop-${i}-${n}`,
            type: n === 0 ? "pickup" : "dropoff",
            status: n === 0 || (i < 5 && n === 1) ? "delivered" : "pending",
          }) as Stop,
      ),
      createdAt: start,
      startedAt: status !== "assigned" ? start : undefined,
      completedAt:
        status === "completed"
          ? new Date(base.getTime() + 7200000).toISOString()
          : undefined,
      distance: 32.4 + i * 2.3,
      duration: 78 + i * 3,
      key: `seed-${i}`,
    };
  });
  // Completed seed trips intentionally have no fabricated proof assets.
  for (const t of trips.filter((t) => t.status === "completed"))
    t.stops.forEach((s) => (s.status = "delivered"));
  const state: FleetState = {
    workspace: { ...defaultWorkspace },
    locations: locations.map((location) => ({ ...location })),
    vehicles,
    drivers,
    safetyHistory: [],
    operatorProfile: { ...defaultOperatorProfile },
    trips,
    contracts: [
      {
        id: "rto-1",
        driverId: "d1",
        vehicleId: "v1",
        total: 180000000,
        openingBalance: 116640000,
        months: 36,
        elapsed: 23,
      },
      {
        id: "rto-2",
        driverId: "d2",
        vehicleId: "v2",
        total: 165000000,
        openingBalance: 72600000,
        months: 36,
        elapsed: 16,
      },
      {
        id: "rto-3",
        driverId: "d3",
        vehicleId: "v3",
        total: 180000000,
        openingBalance: 50400000,
        months: 36,
        elapsed: 10,
      },
    ],
    ledger: [],
    etle: [],
    notices: [
      {
        id: "n1",
        title: "Estimasi kampas rem perlu diperiksa",
        description:
          "22 armada ditandai perlu servis. Tinjau kondisi sebelum penugasan berikutnya.",
        kind: "health",
        href: "/dashboard/safety",
        at: now.toISOString(),
        status: "unread",
      },
      {
        id: "n2",
        title: "Penugasan Bandung Kota berjalan",
        description:
          "Budi Santoso menjalankan TRIP-2026-089. Dua dari lima titik telah selesai.",
        kind: "trip",
        href: "/dashboard/dispatch/trip-89",
        at: base.toISOString(),
        status: "unread",
      },
    ],
    updatedAt: now.toISOString(),
  };
  ensureDemoEtle(state);
  return state;
}
