import type { Vehicle, VehicleType } from "./types";

export const vehicleTypeLabels: Record<VehicleType, string> = {
  car: "Mobil", van: "Van", pickup: "Pikap", truck: "Truk",
  motorcycle: "Sepeda motor", bus: "Bus",
};
export const vehicleTypes = Object.keys(vehicleTypeLabels) as VehicleType[];
export const demoVehicleModels: { model: string; type: VehicleType }[] = [
  { model: "Daihatsu Gran Max Van", type: "van" },
  { model: "Suzuki Carry Pikap", type: "pickup" },
  { model: "Mitsubishi L300 Pikap", type: "pickup" },
  { model: "Isuzu Elf Box", type: "truck" },
  { model: "Hino Dutro Box", type: "truck" },
  { model: "Honda Vario", type: "motorcycle" },
  { model: "Toyota Avanza", type: "car" },
  { model: "Hino Bus", type: "bus" },
  { model: "Toyota Vios", type: "car" },
];
export function inferVehicleType(model: string): VehicleType {
  if (/motor|vario|beat|scoopy|nmax|aerox|supra|mio|vespa/i.test(model)) return "motorcycle";
  if (/\bbus\b|coaster|hiace commuter/i.test(model)) return "bus";
  if (/truk|truck|hino|dutro|elf|fuso|canter/i.test(model)) return "truck";
  if (/pikap|pickup|pick up|carry|l300|hilux|triton/i.test(model)) return "pickup";
  if (/van|gran max|blind|hiace|luxio/i.test(model)) return "van";
  return "car";
}
export function vehicleType(vehicle: Pick<Vehicle, "type" | "model">): VehicleType {
  return vehicleTypes.includes(vehicle.type) ? vehicle.type : inferVehicleType(vehicle.model);
}
// Upgrade only untouched legacy demo models. Operator-created or edited records keep their model.
export function migrateVehicleTypes(vehicles: Vehicle[]) {
  let changed = false;
  for (const v of vehicles) {
    if (vehicleTypes.includes(v.type)) continue;
    const index = /^v([1-9]\d*)$/.exec(v.id);
    const i = index ? Number(index[1]) - 1 : -1;
    const originalModels = ["Daihatsu Gran Max", "Suzuki Carry", "Mitsubishi L300"];
    const demo = i >= 0 && i < 142 && !v.creationKey && !v.version && v.model === originalModels[i % 3];
    if (demo) Object.assign(v, demoVehicleModels[i % demoVehicleModels.length]);
    else v.type = inferVehicleType(v.model);
    v.version = (v.version || 0) + 1;
    changed = true;
  }
  return changed;
}
