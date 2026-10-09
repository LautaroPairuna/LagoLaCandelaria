// Cada persona está pendiente de ingreso, ingresada o finalizada. Cuando pasa la fecha de
// la reserva, quien ingresó queda finalizado solo y quien no ingresó figura como que no vino.
export type EstadoPersona = "pendiente" | "adentro" | "finalizado" | "no-vino"
export type Asistencia = "por-llegar" | "parcial" | "adentro" | "finalizada" | "no-vino"

type ConHoras = { ingresoEn: Date | null; salidaEn: Date | null }

export const nombreDeEstado: Record<EstadoPersona, string> = {
  pendiente: "Pendiente de ingreso",
  adentro: "Ingresado",
  finalizado: "Finalizado",
  "no-vino": "No vino",
}

export const nombreDeAsistencia: Record<Asistencia, string> = {
  "por-llegar": "Por llegar",
  parcial: "Ingreso parcial",
  adentro: "Ingresada",
  finalizada: "Finalizada",
  "no-vino": "No vino",
}

export function estadoDe({ ingresoEn, salidaEn }: ConHoras, fechaPasada = false): EstadoPersona {
  if (!ingresoEn) return fechaPasada ? "no-vino" : "pendiente"
  return salidaEn || fechaPasada ? "finalizado" : "adentro"
}

/// El estado de la reserva sale del de sus personas: nadie llegó, faltan llegar algunos,
/// están todos adentro, o ya terminó. Pasada la fecha, toda reserva a la que entró alguien
/// queda finalizada sola, sin tener que marcar las salidas.
export function asistenciaDe(estados: EstadoPersona[], fechaPasada: boolean): Asistencia {
  const llegaron = estados.filter((estado) => estado === "adentro" || estado === "finalizado").length
  if (llegaron === 0) return fechaPasada ? "no-vino" : "por-llegar"
  if (fechaPasada) return "finalizada"
  if (estados.includes("pendiente")) return "parcial"
  return estados.includes("adentro") ? "adentro" : "finalizada"
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
  const pasada = reserva.hasta < hoy
  const estados = individual ? reserva.personas.map((persona) => estadoDe(persona, pasada)) : [estadoDe(reserva, pasada)]
  const cuenta = (estado: EstadoPersona) => (individual ? estados.filter((item) => item === estado).length : estados[0] === estado ? total : 0)
  return {
    porPersona: individual,
    asistencia: asistenciaDe(estados, pasada),
    pendientes: cuenta("pendiente") + cuenta("no-vino"),
    adentro: cuenta("adentro"),
    salieron: cuenta("finalizado"),
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
