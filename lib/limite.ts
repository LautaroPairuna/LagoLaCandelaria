const marcas = new Map<string, { ventanaMs: number; tiempos: number[] }>()
const MAX_CLAVES = 10_000

function podar(ahora: number) {
  for (const [clave, { ventanaMs, tiempos }] of marcas) {
    if (tiempos.every((tiempo) => ahora - tiempo >= ventanaMs)) marcas.delete(clave)
  }
}

// En memoria alcanza mientras la app corra en un solo contenedor. Con más réplicas
// cada una contaría por su lado y habría que pasar el conteo a Redis.
export function superaLimite(clave: string, maximo: number, ventanaMs: number) {
  const ahora = Date.now()
  if (marcas.size > MAX_CLAVES) podar(ahora)
  const tiempos = (marcas.get(clave)?.tiempos ?? []).filter((tiempo) => ahora - tiempo < ventanaMs)
  const supera = tiempos.length >= maximo
  if (!supera) tiempos.push(ahora)
  marcas.set(clave, { ventanaMs, tiempos })
  return supera
}

export function ipDe(request: Request) {
  const directa = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip")
  if (directa) return directa.trim()
  const cadena = request.headers.get("x-forwarded-for")?.split(",") ?? []
  return cadena.at(-1)?.trim() || "desconocida"
}

export function limiteAlcanzado(clave: string, maximo: number, ventanaMs: number) {
  const ahora = Date.now()
  return (marcas.get(clave)?.tiempos ?? []).filter((tiempo) => ahora - tiempo < ventanaMs).length >= maximo
}

export function registrarUso(clave: string, ventanaMs: number) {
  const ahora = Date.now()
  if (marcas.size > MAX_CLAVES) podar(ahora)
  const tiempos = (marcas.get(clave)?.tiempos ?? []).filter((tiempo) => ahora - tiempo < ventanaMs)
  tiempos.push(ahora)
  marcas.set(clave, { ventanaMs, tiempos })
}
