export function esFechaIso(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [anio, mes, dia] = valor.split("-").map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

function aUtc(iso: string) {
  const [anio, mes, dia] = iso.split("-").map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia))
}

export function sumarDiasIso(iso: string, dias: number) {
  const fecha = aUtc(iso)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

export function diaDeLaSemana(iso: string) {
  return aUtc(iso).getUTCDay()
}

export function fechasEntre(desde: string, hasta: string) {
  const fechas: string[] = []
  for (let cursor = desde; cursor <= hasta; cursor = sumarDiasIso(cursor, 1)) fechas.push(cursor)
  return fechas
}

export function aFechaDb(iso: string) {
  return aUtc(iso)
}

export function deFechaDb(fecha: Date) {
  return fecha.toISOString().slice(0, 10)
}
