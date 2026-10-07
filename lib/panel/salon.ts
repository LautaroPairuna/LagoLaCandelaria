import { HORARIO_RESTAURANTE } from "@/lib/predio/horario"

export type FilaDeMesa = { unidadId: string; reservaId: number; hora: number }
export type Bloque = { reservaId: number; desde: number; hasta: number }

/// Arma, para cada mesa, los tramos del día que ocupa cada reserva: las horas seguidas
/// de una misma reserva forman un bloque (de 12 y 13 sale 12 a 14). Una fila con hora 0
/// (día entero) ocupa todo el horario del restaurante.
export function bloquesPorMesa(filas: FilaDeMesa[]) {
  const horas = new Map<string, Map<number, number[]>>()
  for (const { unidadId, reservaId, hora } of filas) {
    const porReserva = horas.get(unidadId) ?? new Map<number, number[]>()
    const lista = porReserva.get(reservaId) ?? []
    if (hora === 0) {
      for (let h = HORARIO_RESTAURANTE.abre; h < HORARIO_RESTAURANTE.cierra; h += 1) lista.push(h)
    } else lista.push(hora)
    porReserva.set(reservaId, lista)
    horas.set(unidadId, porReserva)
  }

  const bloques = new Map<string, Bloque[]>()
  for (const [unidadId, porReserva] of horas) {
    const lista: Bloque[] = []
    for (const [reservaId, todas] of porReserva) {
      const ordenadas = [...new Set(todas)].sort((a, b) => a - b)
      for (const hora of ordenadas) {
        const ultimo = lista.at(-1)
        if (ultimo && ultimo.reservaId === reservaId && ultimo.hasta === hora) ultimo.hasta = hora + 1
        else lista.push({ reservaId, desde: hora, hasta: hora + 1 })
      }
    }
    bloques.set(unidadId, lista.sort((a, b) => a.desde - b.desde))
  }
  return bloques
}
