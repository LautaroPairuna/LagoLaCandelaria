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

export type ReservaConAsistencia = ConHoras & {
  adultos: number
  menores: number
  sinCargo: number
  hasta: string
  personas: ConHoras[]
  adultosAdentro?: number
  menoresAdentro?: number
}

/// En una reserva por cantidad, cuántos adultos y menores (con los sin cargo) entraron.
/// Con el ingreso marcado y sin cantidades, entró todo el grupo.
export function ingresaronPorCantidad(reserva: Omit<ReservaConAsistencia, "hasta" | "personas">) {
  const menoresTotal = reserva.menores + reserva.sinCargo
  if (!reserva.ingresoEn) return { adultos: 0, menores: 0, adultosTotal: reserva.adultos, menoresTotal }
  const contados = (reserva.adultosAdentro ?? 0) + (reserva.menoresAdentro ?? 0)
  return contados
    ? { adultos: reserva.adultosAdentro ?? 0, menores: reserva.menoresAdentro ?? 0, adultosTotal: reserva.adultos, menoresTotal }
    : { adultos: reserva.adultos, menores: menoresTotal, adultosTotal: reserva.adultos, menoresTotal }
}

export function resumenDeAsistencia(reserva: ReservaConAsistencia, hoy: string) {
  const total = reserva.adultos + reserva.menores + reserva.sinCargo
  const individual = porPersona(reserva)
  const pasada = reserva.hasta < hoy
  if (!individual) return resumenPorCantidad(reserva, total, pasada)
  const estados = reserva.personas.map((persona) => estadoDe(persona, pasada))
  const cuenta = (estado: EstadoPersona) => estados.filter((item) => item === estado).length
  return {
    porPersona: individual,
    asistencia: asistenciaDe(estados, pasada),
    pendientes: cuenta("pendiente") + cuenta("no-vino"),
    adentro: cuenta("adentro"),
    salieron: cuenta("finalizado"),
    total,
  }
}

/// Sin personas cargadas: el grupo entra todo junto o de a partes (por cantidad), y sale
/// todo junto.
function resumenPorCantidad(reserva: ReservaConAsistencia, total: number, pasada: boolean) {
  const { adultos, menores } = ingresaronPorCantidad(reserva)
  const entraron = Math.min(adultos + menores, total)
  const termino = Boolean(reserva.salidaEn) || pasada
  const asistencia: Asistencia = !entraron ? (pasada ? "no-vino" : "por-llegar") : termino ? "finalizada" : entraron < total ? "parcial" : "adentro"
  return {
    porPersona: false,
    asistencia,
    pendientes: total - entraron,
    adentro: termino ? 0 : entraron,
    salieron: termino ? entraron : 0,
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
