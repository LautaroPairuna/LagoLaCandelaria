import { diaDeLaSemana } from "@/lib/predio/fechas"

export type TipoDia = "FERIADO" | "NO_LABORABLE" | "CERRADO" | "ABIERTO"

export type DiaEspecial = {
  fecha: string
  tipo: TipoDia
  motivo: string
}

export type EstadoDelDia = { abierto: true } | { abierto: false; motivo: string }

const CIERRES_ANUALES: Record<string, string> = {
  "12-24": "Nochebuena",
  "12-25": "Navidad",
  "12-31": "Fin de año",
}

const DOMINGO = 0
const LUNES = 1
const MARTES = 2
const SABADO = 6

// Temporada de verano: enero, febrero y, mientras el predio no diga otra cosa,
// del 16 al 31 de diciembre (la especificación cubre "marzo al 15 de diciembre").
function esVerano(fecha: string) {
  const mes = fecha.slice(5, 7)
  return mes === "01" || mes === "02" || (mes === "12" && fecha.slice(8, 10) >= "16")
}

export function estadoDelDia(fecha: string, especiales: ReadonlyMap<string, DiaEspecial>): EstadoDelDia {
  const especial = especiales.get(fecha)
  if (especial?.tipo === "CERRADO") return { abierto: false, motivo: especial.motivo }
  if (especial?.tipo === "ABIERTO") return { abierto: true }

  const cierre = CIERRES_ANUALES[fecha.slice(5)]
  if (cierre) return { abierto: false, motivo: cierre }

  if (especial?.tipo === "FERIADO" || especial?.tipo === "NO_LABORABLE") return { abierto: true }

  const dia = diaDeLaSemana(fecha)
  if (esVerano(fecha)) {
    return dia === LUNES || dia === MARTES ? { abierto: false, motivo: "En verano abrimos de miércoles a domingo." } : { abierto: true }
  }
  return dia === SABADO || dia === DOMINGO
    ? { abierto: true }
    : { abierto: false, motivo: "De marzo a mediados de diciembre abrimos sábados, domingos y feriados." }
}

export function mapaDeEspeciales(dias: DiaEspecial[]) {
  return new Map(dias.map((dia) => [dia.fecha, dia]))
}
