import { diaDeLaSemana, esFechaIso, sumarDiasIso } from "@/lib/predio/fechas"

export const MAX_DIAS = 400

export function atajosDeCaja(hoy: string) {
  return [
    { id: "30dias", nombre: "Últimos 30 días", desde: sumarDiasIso(hoy, -29), hasta: hoy },
    { id: "hoy", nombre: "Hoy", desde: hoy, hasta: hoy },
    { id: "ayer", nombre: "Ayer", desde: sumarDiasIso(hoy, -1), hasta: sumarDiasIso(hoy, -1) },
    { id: "semana", nombre: "Esta semana", desde: sumarDiasIso(hoy, -((diaDeLaSemana(hoy) + 6) % 7)), hasta: hoy },
    { id: "mes", nombre: "Este mes", desde: `${hoy.slice(0, 7)}-01`, hasta: hoy },
  ]
}

/// Lee el período de la URL; si no es válido, muestra los últimos 30 días.
export function periodoDeCaja(desde: string | undefined, hasta: string | undefined, hoy: string) {
  if (desde && hasta && esFechaIso(desde) && esFechaIso(hasta) && desde <= hasta && hasta <= sumarDiasIso(desde, MAX_DIAS)) {
    return { desde, hasta }
  }
  return { desde: sumarDiasIso(hoy, -29), hasta: hoy }
}
