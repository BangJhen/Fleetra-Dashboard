import type { Vehicle } from "@/lib/types";
import { vehicleType, vehicleTypeLabels } from "@/lib/vehicle-types";

export function VehicleArt({ vehicle, compact = false }: {
  vehicle: Pick<Vehicle, "type" | "model">; compact?: boolean;
}) {
  const type = vehicleType(vehicle);
  const tallCar = /avanza|innova|suv|fortuner|xpander|ertiga|rush/i.test(vehicle.model);
  const largeTruck = /hino|fuso/i.test(vehicle.model);
  const wheels = type === "motorcycle" ? [82, 205] : type === "truck" && largeTruck ? [63, 98, 222] : [66, 215];
  return (
    <svg viewBox="0 0 280 140" width={compact ? 40 : 220} height={compact ? 26 : 110} fill="none" className={`vehicle-art vehicle-art-${type}`}
      role={compact ? undefined : "img"} aria-hidden={compact || undefined}
      aria-label={compact ? undefined : `${vehicleTypeLabels[type]} ${vehicle.model}`}>
      <g strokeLinejoin="round" strokeLinecap="round" strokeWidth={compact ? 5 : 2.5}>
        {type === "truck" && <>
          <path d="M25 30h153v77H25z" fill="#EAF3FF" stroke="#2463D8" />
          <path d="M178 54h45l28 30v23h-73V54Z" fill="#F1F5F9" stroke="#64748B" />
          <path d="M190 63h28l20 23h-48V63Z" fill="#D3E4FA" />
          <path d="M43 47h78M43 58h52M199 94h10" stroke="#2463D8" />
          <path d="M235 96h14M23 108h230" stroke="#64748B" />
        </>}
        {type === "pickup" && <>
          <path d="M23 72h136v34H23z" fill="#EAF3FF" stroke="#2463D8" />
          <path d="M159 47h46l43 35v24h-89V47Z" fill="#F1F5F9" stroke="#64748B" />
          <path d="M170 57h31l29 25h-60V57Z" fill="#D3E4FA" />
          <path d="M39 86h103M177 91h14M236 94h12" stroke="#2463D8" />
        </>}
        {type === "van" && <>
          <path d="M28 105V42q0-10 12-10h141q14 0 23 14l33 44v15H28Z" fill="#EAF3FF" stroke="#2463D8" />
          <path d="M162 43h20q8 0 15 12l17 24h-52V43Z" fill="#D3E4FA" stroke="#64748B" />
          <path d="M44 47h93v31H44z" fill="#D3E4FA" />
          <path d="M151 42v59M91 47v31M166 89h12M29 93h12M228 91h10" stroke="#64748B" />
        </>}
        {type === "car" && <>
          <path d={tallCar ? "M25 104V83l17-36q5-10 17-10h118q13 0 24 13l28 34 23 8v12H25Z" : "M23 104V86l31-10 30-33h85q12 0 24 13l22 23 33 9v16H23Z"}
            fill="#EAF3FF" stroke="#2463D8" />
          <path d={tallCar ? "M56 48h45v31H42l14-31ZM112 48h62l26 31h-88V48Z" : "M91 52h24v26H68l23-26ZM126 52h40q9 0 17 10l15 16h-72V52Z"}
            fill="#D3E4FA" stroke="#64748B" />
          <path d="M121 86v18M137 87h13M29 91h13M234 94h16" stroke="#64748B" />
        </>}
        {type === "motorcycle" && <>
          <path d="M82 108h69l38-58 16 58M82 108l35-45h39l-5 45M117 63l-9-14M184 43h16l7 9" stroke="#64748B" />
          <path d="M115 61h44l14 17-18 16h-47l-16-17 23-16Z" fill="#EAF3FF" stroke="#2463D8" />
          <path d="M102 53h43M189 49l-5-19h-18" stroke="#2463D8" strokeWidth={compact ? 6 : 5} />
          <path d="M60 91q20-20 43 0M186 90q21-16 38 3" stroke="#2463D8" />
          <path d="M174 61h15l8 12h-18z" fill="#D3E4FA" stroke="#64748B" />
        </>}
        {type === "bus" && <>
          <path d="M22 104V32q0-9 11-9h197q17 0 17 16v65H22Z" fill="#EAF3FF" stroke="#2463D8" />
          <path d="M35 35h170v40H35zM214 35h20v40h-20z" fill="#D3E4FA" stroke="#64748B" />
          <path d="M69 35v40M103 35v40M137 35v40M171 35v40M207 82v22M226 82v22M29 87h161" stroke="#64748B" />
        </>}
        {wheels.map((x) => <g key={x}>
          <circle cx={x} cy="107" r={type === "motorcycle" ? 21 : 17} fill="#FFFFFF" stroke="#64748B" strokeWidth={compact ? 5 : 3} />
          <circle cx={x} cy="107" r={type === "motorcycle" ? 6 : 5.5} fill="#CBD5E1" stroke="none" />
        </g>)}
      </g>
    </svg>
  );
}
