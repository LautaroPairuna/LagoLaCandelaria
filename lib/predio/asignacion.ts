import {
  MAX_PERSONAS_PARRILLA,
  gruposDeParrillas,
  idDeUnidad,
  unidadesDelTipo,
  type UnidadPredio,
} from "@/lib/predio/inventario"

export type Asignacion = { unidades: UnidadPredio[] } | { sinLugar: true }

const porNumero = (a: UnidadPredio, b: UnidadPredio) => a.numero - b.numero

// Los grupos chicos van primero a las parrillas de 1 mesa; cuando se llenan pasan
// a las de 2 y después a las de 3. Más de 18 personas van a un quincho.
export function asignarParrilla(personas: number, libre: (id: string) => boolean): Asignacion {
  if (personas < 1) return { sinLugar: true }

  if (personas > MAX_PERSONAS_PARRILLA) {
    const quincho = unidadesDelTipo("QUINCHO").sort(porNumero).find((item) => libre(item.id))
    return quincho ? { unidades: [quincho] } : { sinLugar: true }
  }

  const candidatos = [...gruposDeParrillas]
    .filter((grupo) => grupo.capacidad >= personas)
    .sort((a, b) => a.capacidad - b.capacidad)
    .flatMap((grupo) => [...grupo.numeros].sort((a, b) => a - b).map((numero) => idDeUnidad("PARRILLA", numero)))

  const elegida = candidatos.find(libre)
  if (!elegida) return { sinLugar: true }
  const parrilla = unidadesDelTipo("PARRILLA").find((item) => item.id === elegida)
  return parrilla ? { unidades: [parrilla] } : { sinLugar: true }
}

export function lugaresDePlayaPara(personas: number) {
  if (personas < 4) return 1
  if (personas <= 8) return 2
  return 3
}

// Si alcanza, todos los lugares del grupo salen del mismo tipo (palapas o gazebos)
// para que queden juntos; si no, se completan con el otro.
export function asignarPlaya(personas: number, libre: (id: string) => boolean): Asignacion {
  if (personas < 1) return { sinLugar: true }
  const cantidad = lugaresDePlayaPara(personas)
  const palapas = unidadesDelTipo("PALAPA").sort(porNumero).filter((item) => libre(item.id))
  const gazebos = unidadesDelTipo("GAZEBO").sort(porNumero).filter((item) => libre(item.id))

  for (const grupo of [palapas, gazebos]) {
    if (grupo.length >= cantidad) return { unidades: grupo.slice(0, cantidad) }
  }
  const mezcla = [...palapas, ...gazebos]
  return mezcla.length >= cantidad ? { unidades: mezcla.slice(0, cantidad) } : { sinLugar: true }
}
