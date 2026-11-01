import type { FleetState, OperatorProfile } from "./types";
export const defaultOperatorProfile: OperatorProfile = {
  name: "Fleet Manager",
  email: "manager@fleetra.demo",
  phone: "",
  version: 0,
};
export function updateOperatorProfile(
  s: FleetState,
  body: Record<string, unknown>,
) {
  s.operatorProfile = validateOperatorProfile(
    s.operatorProfile || defaultOperatorProfile,
    body,
  );
  return { id: "operator-demo" };
}
export function validateOperatorProfile(
  current: OperatorProfile,
  body: Record<string, unknown>,
): OperatorProfile {
  if (body.version !== current.version)
    throw Error("Profil sudah berubah. Muat ulang sebelum menyimpan kembali.");
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 80
  )
    throw Error("Nama wajib diisi dengan maksimal 80 karakter.");
  if (
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.email.trim())
  )
    throw Error("Email kontak tidak valid.");
  if (
    typeof body.phone !== "string" ||
    (body.phone.trim() && !/^\+?[0-9 ()-]{7,25}$/.test(body.phone.trim()))
  )
    throw Error("Nomor telepon tidak valid.");
  return {
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    version: current.version + 1,
  };
}
