import { diaDeLaSemana, fechasEntre, sumarDiasIso } from "@/lib/predio/fechas"

export type Barra<T> = {
  reserva: T
  columna: number
  largo: number
  carril: number
  empiezaAca: boolean
  terminaAca: boolean
}

export type Semana<T> = {
  dias: (string | null)[]
  barras: Barra<T>[]
  // Reservas que no entraron en los carriles visibles, por columna.
  masPorColumna: number[]
}

type ConFechas = { id: number; desde: string; hasta: string }

/// Arma las filas del calendario (de lunes a domingo) y reparte cada reserva en carriles
/// para que se dibuje como una barra continua en vez de un número suelto por día.
export function armarSemanas<T extends ConFechas>(mes: string, reservas: T[], carriles: number): Semana<T>[] {
  const inicio = `${mes}-01`
  const fin = sumarDiasIso(`${sumarMes(mes)}-01`, -1)
  const dias = fechasEntre(inicio, fin)
  const huecos: (string | null)[] = [...Array<null>((diaDeLaSemana(inicio) + 6) % 7).fill(null), ...dias]
  while (huecos.length % 7 !== 0) huecos.push(null)

  const ordenadas = [...reservas].sort((a, b) => a.desde.localeCompare(b.desde) || b.hasta.localeCompare(a.hasta) || a.id - b.id)
  const semanas: Semana<T>[] = []

  for (let desplazamiento = 0; desplazamiento < huecos.length; desplazamiento += 7) {
    const fila = huecos.slice(desplazamiento, desplazamiento + 7)
    const primero = fila.find((dia) => dia)!
    const ultimo = fila.findLast((dia) => dia)!
    const columnaDe = (fecha: string) => fila.indexOf(fecha)
    const ocupados: boolean[][] = []
    const barras: Barra<T>[] = []
    const masPorColumna = Array<number>(7).fill(0)

    for (const reserva of ordenadas) {
      if (reserva.desde > ultimo || reserva.hasta < primero) continue
      const desde = reserva.desde < primero ? primero : reserva.desde
      const hasta = reserva.hasta > ultimo ? ultimo : reserva.hasta
      const columna = columnaDe(desde)
      const largo = columnaDe(hasta) - columna + 1
      let carril = ocupados.findIndex((usado) => usado.slice(columna, columna + largo).every((celda) => !celda))
      if (carril === -1) carril = ocupados.length
      if (carril >= carriles) {
        for (let punto = columna; punto < columna + largo; punto += 1) masPorColumna[punto] += 1
        continue
      }
      ocupados[carril] ??= Array<boolean>(7).fill(false)
      for (let punto = columna; punto < columna + largo; punto += 1) ocupados[carril][punto] = true
      barras.push({ reserva, columna, largo, carril, empiezaAca: reserva.desde >= primero, terminaAca: reserva.hasta <= ultimo })
    }
    semanas.push({ dias: fila, barras, masPorColumna })
  }
  return semanas
}

function sumarMes(mes: string) {
  const [anio, numero] = mes.split("-").map(Number)
  return new Date(Date.UTC(anio, numero, 1)).toISOString().slice(0, 7)
}
