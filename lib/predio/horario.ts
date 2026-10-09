// Las mesas del restaurante se reservan por horario: la misma mesa puede tener una
// reserva de 10 a 12 y otra de 13 a 16. Se ocupan por horas enteras, dentro del horario
// del predio.
export const HORARIO_RESTAURANTE = { abre: 10, cierra: 19 } as const

/// De `desde` (incluida) a `hasta` (sin incluir): 12 a 14 ocupa las horas 12 y 13.
export type Franja = { desde: number; hasta: number }

export function esFranja(franja: Franja) {
  const { abre, cierra } = HORARIO_RESTAURANTE
  return Number.isInteger(franja.desde) && Number.isInteger(franja.hasta) && franja.desde >= abre && franja.hasta <= cierra && franja.hasta > franja.desde
}

export function horasDe({ desde, hasta }: Franja) {
  return Array.from({ length: hasta - desde }, (_, indice) => desde + indice)
}

export function textoDeHora(hora: number) {
  return `${String(hora).padStart(2, "0")}:00`
}

/// "12-14" en la URL.
export function leerFranja(valor: string | null): Franja | null {
  const partes = /^(\d{1,2})-(\d{1,2})$/.exec(valor ?? "")
  if (!partes) return null
  const franja = { desde: Number(partes[1]), hasta: Number(partes[2]) }
  return esFranja(franja) ? franja : null
}

/// Cómo figura una hora ocupada en el mapa de ocupación, junto a los días enteros.
export function claveDeHora(fecha: string, hora: number) {
  return `${fecha}@${hora}`
}
