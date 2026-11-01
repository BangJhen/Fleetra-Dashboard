export type VehicleType = "car" | "van" | "pickup" | "truck" | "motorcycle" | "bus";
export type VehicleStatus = "moving" | "idle" | "service";
export type TripStatus = "assigned" | "in_progress" | "completed" | "cancelled";
export interface Vehicle {
  archivedAt?: string;
  version?: number;
  creationKey?: string;
  id: string;
  plate: string;
  model: string;
  type: VehicleType;
  status: VehicleStatus;
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  fuel: number;
  brake: number;
  odometer: number;
  health: number;
  location: string;
}
export interface Driver {
  archivedAt?: string;
  version?: number;
  creationKey?: string;
  id: string;
  name: string;
  phone: string;
  score: number;
  trips: number;
  braking: number;
  speeding: number;
}
export interface Stop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "pickup" | "dropoff";
  status: "pending" | "arrived" | "delivered" | "failed_attempt";
  failureReason?: string;
  epod?: { recipient: string; photo: string; signature: string; at: string };
}
export interface Trip {
  id: string;
  code: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  stops: Stop[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  distance: number;
  duration: number;
  route?: [number, number][];
  routeSource?: "OSRM";
  key: string;
}
export interface Contract {
  id: string;
  driverId: string;
  vehicleId: string;
  total: number;
  openingBalance: number;
  months: number;
  elapsed: number;
}
export interface Ledger {
  id: string;
  contractId: string;
  tripId: string;
  amount: number;
  at: string;
}
export interface Etle {
  id: string;
  reference: string;
  plate: string;
  at: string;
  location: string;
  candidates: string[];
  source?: "simulasi" | "operator";
  status:
    "unmatched" | "candidate_match" | "needs_review" | "confirmed" | "disputed";
}
export interface Notice {
  id: string;
  title: string;
  description: string;
  kind: "trip" | "health" | "sos";
  href: string;
  at: string;
  status: "unread" | "read" | "acknowledged" | "resolved";
}
export interface SafetySnapshot {
  id: string;
  kind: "vehicles" | "drivers";
  entityId: string;
  at: string;
  source: "baseline" | "master" | "manual";
  note: string;
  key?: string;
  values: {
    status?: VehicleStatus;
    health?: number;
    brake?: number;
    fuel?: number;
    odometer?: number;
    speed?: number;
    score?: number;
    braking?: number;
    speeding?: number;
    trips?: number;
  };
}
export interface OperatorProfile {
  isDemo?: boolean;
  name: string;
  email: string;
  phone: string;
  version: number;
}
export interface FleetState {
  workspace: { name: string; region: string };
  locations: { name: string; address: string; lat: number; lng: number }[];
  operatorProfile: OperatorProfile;
  safetyHistory: SafetySnapshot[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  contracts: Contract[];
  ledger: Ledger[];
  etle: Etle[];
  notices: Notice[];
  updatedAt: string;
}
export const statusLabel: Record<string, string> = {
  moving: "Bergerak",
  idle: "Idle",
  service: "Perlu servis",
  assigned: "Ditugaskan",
  in_progress: "Berjalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  unmatched: "Tidak cocok",
  candidate_match: "Kandidat ditemukan",
  needs_review: "Perlu ditinjau",
  confirmed: "Dikonfirmasi internal",
  disputed: "Disengketakan",
};
