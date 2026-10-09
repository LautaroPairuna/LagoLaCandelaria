import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { bungalowsPara } from "@/lib/predio/bungalows"
import type { Grupo } from "@/lib/predio/cotizacion"
import { MAX_PERSONAS_PARRILLA, type UnidadPredio } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { bandaDeEdad } from "@/lib/predio/tarifas"

export type TipoDeLugar = "parrilla" | "gazebo" | "palapa" | "playa" | "bungalow" | "restaurante" | "bar"

export type Regla =
  | { modo: "capacidad"; personas: number; tipo: "PARRILLA" | "MESA_RESTAURANTE" | "MESA_BAR" }
  | { modo: "quincho" }
  | { modo: "cantidad"; cantidad: number; tipos: UnidadPredio["tipo"][] }

/// Lo que tiene que elegir el grupo según la especificación: una o más parrillas que
/// sumen la capacidad (más de 18 personas, un quincho), 1 a 3 lugares de playa según el
/// tamaño del grupo, un bungalow cada 4 personas, y en el restaurante una o más mesas
/// que sumen la capacidad.
export function reglaDe(tipo: TipoDeLugar, personas: number): Regla {
  if (tipo === "parrilla") return personas > MAX_PERSONAS_PARRILLA ? { modo: "quincho" } : { modo: "capacidad", personas, tipo: "PARRILLA" }
  if (tipo === "restaurante") return { modo: "capacidad", personas, tipo: "MESA_RESTAURANTE" }
  if (tipo === "bar") return { modo: "capacidad", personas, tipo: "MESA_BAR" }
  if (tipo === "gazebo") return { modo: "cantidad", cantidad: lugaresDePlayaPara(personas), tipos: ["GAZEBO"] }
  if (tipo === "palapa") return { modo: "cantidad", cantidad: lugaresDePlayaPara(personas), tipos: ["PALAPA"] }
  if (tipo === "playa") return { modo: "cantidad", cantidad: lugaresDePlayaPara(personas), tipos: ["GAZEBO", "PALAPA"] }
  return { modo: "cantidad", cantidad: bungalowsPara(personas), tipos: ["BUNGALOW"] }
}

const nombre = (unidad: UnidadPredio) => `${nombreDeUnidad[unidad.tipo].toLowerCase()} ${unidad.etiqueta}`

function palabra(tipo: TipoDeLugar, cantidad: number) {
  if (tipo === "bungalow") return cantidad === 1 ? "bungalow" : "bungalows"
  if (tipo === "gazebo") return cantidad === 1 ? "gazebo" : "gazebos"
  if (tipo === "palapa") return cantidad === 1 ? "palapa" : "palapas"
  if (tipo === "playa") return cantidad === 1 ? "lugar" : "lugares"
  if (tipo === "restaurante" || tipo === "bar") return cantidad === 1 ? "mesa" : "mesas"
  return cantidad === 1 ? "parrilla" : "parrillas"
}

export type Revision = { ok: true } | { ok: false; mensaje: string; faltan: boolean }

export function revisarEleccion(tipo: TipoDeLugar, personas: number, elegidas: UnidadPredio[]): Revision {
  const regla = reglaDe(tipo, personas)

  if (regla.modo === "quincho") {
    if (elegidas.length === 1 && elegidas[0].tipo === "QUINCHO") return { ok: true }
    return { ok: false, faltan: elegidas.length === 0, mensaje: `Para más de ${MAX_PERSONAS_PARRILLA} personas va un quincho: elegí uno.` }
  }

  if (regla.modo === "capacidad") {
    if (elegidas.some((unidad) => unidad.tipo !== regla.tipo)) return { ok: false, faltan: false, mensaje: `Elegí solo ${palabra(tipo, 2)}.` }
    const capacidad = elegidas.reduce((suma, unidad) => suma + (unidad.capacidad ?? 0), 0)
    if (capacidad < personas) {
      return {
        ok: false,
        faltan: true,
        mensaje: elegidas.length
          ? `Con lo que elegiste entran ${capacidad} personas y son ${personas}: sumá otra ${palabra(tipo, 1)}.`
          : `Elegí una ${palabra(tipo, 1)} para ${personas} ${personas === 1 ? "persona" : "personas"}, o varias que sumen.`,
      }
    }
    const sobrante = elegidas.find((unidad) => capacidad - (unidad.capacidad ?? 0) >= personas)
    if (sobrante) return { ok: false, faltan: false, mensaje: `Ya entran sin la ${nombre(sobrante)}: sacala así queda libre para otros.` }
    return { ok: true }
  }

  if (elegidas.some((unidad) => !regla.tipos.includes(unidad.tipo))) return { ok: false, faltan: false, mensaje: `Elegí solo ${palabra(tipo, 2)}.` }
  const diferencia = regla.cantidad - elegidas.length
  if (diferencia > 0) {
    return {
      ok: false,
      faltan: true,
      mensaje: `Para ${personas} ${personas === 1 ? "persona" : "personas"} ${regla.cantidad === 1 ? "va" : "van"} ${regla.cantidad} ${palabra(tipo, regla.cantidad)}: ${elegidas.length ? `elegí ${diferencia} más` : "elegilos en el mapa"}.`,
    }
  }
  if (diferencia < 0) {
    return { ok: false, faltan: false, mensaje: `Para ${personas} personas alcanza con ${regla.cantidad} ${palabra(tipo, regla.cantidad)}: sacá ${-diferencia}.` }
  }
  return { ok: true }
}

/// Si con los lugares libres de un día el grupo puede armar una elección válida.
export function hayLugarPara(tipo: TipoDeLugar, personas: number, libres: UnidadPredio[]) {
  const regla = reglaDe(tipo, personas)
  if (regla.modo === "quincho") return libres.some((unidad) => unidad.tipo === "QUINCHO")
  if (regla.modo === "capacidad") {
    return libres.filter((unidad) => unidad.tipo === regla.tipo).reduce((suma, unidad) => suma + (unidad.capacidad ?? 0), 0) >= personas
  }
  return libres.filter((unidad) => regla.tipos.includes(unidad.tipo)).length >= regla.cantidad
}

/// Una elección razonable para el botón "Elegir por mí": la parrilla (o mesa) más chica
/// que alcance o, si no hay, las más grandes que sumen; en la playa y los bungalows, los
/// primeros libres.
export function sugerir(tipo: TipoDeLugar, personas: number, libres: UnidadPredio[]): UnidadPredio[] | null {
  const regla = reglaDe(tipo, personas)
  const ordenadas = [...libres].sort((a, b) => a.numero - b.numero)
  if (regla.modo === "quincho") {
    const quincho = ordenadas.find((unidad) => unidad.tipo === "QUINCHO")
    return quincho ? [quincho] : null
  }
  if (regla.modo === "capacidad") {
    const parrillas = ordenadas.filter((unidad) => unidad.tipo === regla.tipo)
    const justa = [...parrillas].sort((a, b) => (a.capacidad ?? 0) - (b.capacidad ?? 0)).find((unidad) => (unidad.capacidad ?? 0) >= personas)
    if (justa) return [justa]
    // Se van tomando las más grandes y, cuando una sola alcanza para los que faltan,
    // la más chica de esas: así no se ocupa una mesa grande para dos personas.
    const elegidas: UnidadPredio[] = []
    const quedan = [...parrillas].sort((a, b) => (a.capacidad ?? 0) - (b.capacidad ?? 0))
    let faltan = personas
    while (faltan > 0 && quedan.length) {
      const alcanza = quedan.findIndex((unidad) => (unidad.capacidad ?? 0) >= faltan)
      const mayor = quedan.findIndex((unidad) => unidad.capacidad === quedan.at(-1)!.capacidad)
      const unidad = quedan.splice(alcanza === -1 ? mayor : alcanza, 1)[0]
      elegidas.push(unidad)
      faltan -= unidad.capacidad ?? 0
    }
    return faltan <= 0 ? elegidas : null
  }
  const delTipo = ordenadas.filter((unidad) => regla.tipos.includes(unidad.tipo))
  if (tipo === "playa") {
    for (const tipoUnico of ["PALAPA", "GAZEBO"] as const) {
      const mismas = delTipo.filter((unidad) => unidad.tipo === tipoUnico)
      if (mismas.length >= regla.cantidad) return mismas.slice(0, regla.cantidad)
    }
  }
  return delTipo.length >= regla.cantidad ? delTipo.slice(0, regla.cantidad) : null
}

/// Las franjas de la tarifa salen de la edad de cada persona.
export function grupoPorEdades(edades: number[]): Grupo {
  const grupo: Grupo = { adultos: 0, menores: 0, sinCargo: 0 }
  for (const edad of edades) {
    const banda = bandaDeEdad(edad)
    if (banda === "adulto") grupo.adultos += 1
    else if (banda === "menor") grupo.menores += 1
    else grupo.sinCargo += 1
  }
  return grupo
}
