export type EstadoPersona = "pendiente" | "adentro" | "salio"
export type Asistencia = "por-llegar" | "parcial" | "adentro" | "finalizada" | "no-vino"

type ConHoras = { ingresoEn: Date | null; salidaEn: Date | null }

export const nombreDeEstado: Record<EstadoPersona, string> = {
  pendiente: "Pendiente de ingreso",
  adentro: "Ingresado",
  salio: "Finalizado",
}

export const nombreDeAsistencia: Record<Asistencia, string> = {
  "por-llegar": "Por llegar",
  parcial: "Ingreso parcial",
  adentro: "Adentro",
  finalizada: "Finalizada",
  "no-vino": "No vino",
}

export function estadoDe({ ingresoEn, salidaEn }: ConHoras): EstadoPersona {
  if (!ingresoEn) return "pendiente"
  return salidaEn ? "salio" : "adentro"
}

/// El estado de la reserva sale del de sus personas: nadie llegó (por llegar, o no vino
/// si la fecha ya pasó), faltan llegar algunos, están todos adentro, o ya se fueron.
export function asistenciaDe(estados: EstadoPersona[], fechaPasada: boolean): Asistencia {
  const vinieron = estados.filter((estado) => estado !== "pendiente").length
  if (vinieron === 0) return fechaPasada ? "no-vino" : "por-llegar"
  if (!estados.includes("adentro")) return "finalizada"
  return estados.includes("pendiente") ? "parcial" : "adentro"
}

/// Si la reserva tiene a cada persona cargada se registra persona por persona; si no
/// (grupos estudiantiles, reservas viejas) se registra la reserva entera.
export function porPersona(reserva: { adultos: number; menores: number; sinCargo: number; personas: unknown[] }) {
  return reserva.personas.length > 0 && reserva.personas.length >= reserva.adultos + reserva.menores + reserva.sinCargo
}

export type ReservaConAsistencia = ConHoras & { adultos: number; menores: number; sinCargo: number; hasta: string; personas: ConHoras[] }

export function resumenDeAsistencia(reserva: ReservaConAsistencia, hoy: string) {
  const total = reserva.adultos + reserva.menores + reserva.sinCargo
  const individual = porPersona(reserva)
  const estados = individual ? reserva.personas.map(estadoDe) : [estadoDe(reserva)]
  const cuenta = (estado: EstadoPersona) => (individual ? estados.filter((item) => item === estado).length : estados[0] === estado ? total : 0)
  return {
    porPersona: individual,
    asistencia: asistenciaDe(estados, reserva.hasta < hoy),
    pendientes: cuenta("pendiente"),
    adentro: cuenta("adentro"),
    salieron: cuenta("salio"),
    total,
  }
}

export type Movimiento = "ingreso" | "salida" | "deshacer"

/// Qué cambia en una persona (o en la reserva entera) con cada movimiento. Devuelve null
/// si no corresponde: entrar dos veces, salir sin haber entrado.
export function aplicar(movimiento: Movimiento, actual: ConHoras, ahora: Date): ConHoras | null {
  if (movimiento === "ingreso") return actual.ingresoEn ? null : { ingresoEn: ahora, salidaEn: null }
  if (movimiento === "salida") return actual.ingresoEn && !actual.salidaEn ? { ingresoEn: actual.ingresoEn, salidaEn: ahora } : null
  if (actual.salidaEn) return { ingresoEn: actual.ingresoEn, salidaEn: null }
  return actual.ingresoEn ? { ingresoEn: null, salidaEn: null } : null
}
