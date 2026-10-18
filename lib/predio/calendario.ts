import { diaDeLaSemana } from "@/lib/predio/fechas"
import type { TipoDeDia } from "@/lib/predio/tarifas"

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

/// Temporada en que el predio abre también de miércoles a viernes (mes-día, inclusive).
/// El resto del año abre sábados, domingos y feriados. Un día puntual se abre o se cierra
/// desde el panel, con los días especiales.
export const TEMPORADA_DE_SEMANA = { desde: "01-06", hasta: "02-19" } as const

function esTemporadaDeSemana(fecha: string) {
  const mesDia = fecha.slice(5)
  return mesDia >= TEMPORADA_DE_SEMANA.desde && mesDia <= TEMPORADA_DE_SEMANA.hasta
}

export function estadoDelDia(fecha: string, especiales: ReadonlyMap<string, DiaEspecial>): EstadoDelDia {
  const especial = especiales.get(fecha)
  if (especial?.tipo === "CERRADO") return { abierto: false, motivo: especial.motivo }
  if (especial?.tipo === "ABIERTO") return { abierto: true }

  const cierre = CIERRES_ANUALES[fecha.slice(5)]
  if (cierre) return { abierto: false, motivo: cierre }

  if (especial?.tipo === "FERIADO" || especial?.tipo === "NO_LABORABLE") return { abierto: true }

  const dia = diaDeLaSemana(fecha)
  if (esTemporadaDeSemana(fecha)) {
    return dia === LUNES || dia === MARTES ? { abierto: false, motivo: "En verano abrimos de miércoles a domingo." } : { abierto: true }
  }
  return dia === SABADO || dia === DOMINGO
    ? { abierto: true }
    : { abierto: false, motivo: "Fuera del verano abrimos sábados, domingos y feriados." }
}

/// Qué tarifa corresponde: sábados, domingos y feriados (o no laborables) van con la de
/// fin de semana; el resto, con la de semana.
export function tipoDeDia(fecha: string, especiales: ReadonlyMap<string, DiaEspecial>): TipoDeDia {
  const especial = especiales.get(fecha)
  if (especial?.tipo === "FERIADO" || especial?.tipo === "NO_LABORABLE") return "finde"
  const dia = diaDeLaSemana(fecha)
  return dia === SABADO || dia === DOMINGO ? "finde" : "semana"
}

export function mapaDeEspeciales(dias: DiaEspecial[]) {
  return new Map(dias.map((dia) => [dia.fecha, dia]))
}
