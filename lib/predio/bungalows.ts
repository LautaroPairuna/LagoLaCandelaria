import { fechasEntre, sumarDiasIso } from "@/lib/predio/fechas"
import { unidadesDelTipo, type UnidadPredio } from "@/lib/predio/inventario"

const CAPACIDAD_BUNGALOW = 4
const TRAMO_CORTO = 6

export type EstadoBungalow = "libre" | "ocupado" | "deja-huecos"

// Las estadías ocupan días enteros y se piden de a dos fechas correlativas. Una
// estadía no puede dejar a los dos lados un tramo libre impar si había forma de no
// dejarlo: con 4 días libres se puede tomar el 1–2 o el 3–4, nunca el 2–3. Con 3 o 5
// días libres siempre sobra uno, así que da igual. La regla se aplica a tramos de hasta
// 6 días; uno más largo (null) se sigue pudiendo reservar y no cuenta como hueco.
export function seleccionPermitida(libresAntes: number | null, libresDespues: number | null) {
  const impar = (libres: number | null) => libres !== null && libres % 2 === 1
  if (libresAntes === null || libresDespues === null) return !impar(libresAntes) && !impar(libresDespues)
  return !(impar(libresAntes) && impar(libresDespues))
}

function libresHacia(ocupadas: ReadonlySet<string>, inicio: string, paso: 1 | -1, hoy: string) {
  let libres = 0
  for (let fecha = inicio; ; fecha = sumarDiasIso(fecha, paso)) {
    if (fecha < hoy || ocupadas.has(fecha)) return libres
    libres += 1
    if (libres > TRAMO_CORTO) return null
  }
}

export function estadoDelBungalow(
  ocupadas: ReadonlySet<string>,
  desde: string,
  hasta: string,
  hoy: string,
): EstadoBungalow {
  if (fechasEntre(desde, hasta).some((fecha) => ocupadas.has(fecha))) return "ocupado"
  const antes = libresHacia(ocupadas, sumarDiasIso(desde, -1), -1, hoy)
  const despues = libresHacia(ocupadas, sumarDiasIso(hasta, 1), 1, hoy)
  return seleccionPermitida(antes, despues) ? "libre" : "deja-huecos"
}

export function bungalowsPara(personas: number) {
  return Math.max(1, Math.ceil(personas / CAPACIDAD_BUNGALOW))
}

export function asignarBungalows(
  personas: number,
  desde: string,
  hasta: string,
  hoy: string,
  ocupacion: ReadonlyMap<string, ReadonlySet<string>>,
): { unidades: UnidadPredio[] } | { sinLugar: true; motivo: Exclude<EstadoBungalow, "libre"> } {
  const cantidad = bungalowsPara(personas)
  const vacio = new Set<string>()
  const estados = unidadesDelTipo("BUNGALOW")
    .sort((a, b) => a.numero - b.numero)
    .map((bungalow) => ({ bungalow, estado: estadoDelBungalow(ocupacion.get(bungalow.id) ?? vacio, desde, hasta, hoy) }))

  const libres = estados.filter((item) => item.estado === "libre").map((item) => item.bungalow)
  if (libres.length >= cantidad) return { unidades: libres.slice(0, cantidad) }
  const huecos = estados.filter((item) => item.estado === "deja-huecos").length
  return { sinLugar: true, motivo: libres.length + huecos >= cantidad ? "deja-huecos" : "ocupado" }
}
