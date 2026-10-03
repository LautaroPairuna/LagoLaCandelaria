import "dotenv/config"

import { leerSolicitudLegado, reservaDesdeLegado, unidadesLegado } from "@/lib/legado"
import { db } from "@/lib/prisma"
import { crearReserva, ocupadosEntre } from "@/lib/reservas"

const prisma = db()
const filas = await prisma.reservationInquiry.findMany({ orderBy: { createdAt: "asc" } })
const yaMigradas = new Set(
  (await prisma.reserva.findMany({ where: { token: { in: filas.map((fila) => fila.id) } }, select: { token: true } })).map(
    (reserva) => reserva.token,
  ),
)

const resumen = { migradas: 0, yaEstaban: 0, sinSolicitud: [] as string[], superpuestas: [] as string[] }

for (const fila of filas) {
  if (yaMigradas.has(fila.id)) {
    resumen.yaEstaban += 1
    continue
  }
  const solicitud = leerSolicitudLegado(fila.message)
  if (!solicitud) {
    resumen.sinSolicitud.push(fila.id)
    continue
  }
  // Dos solicitudes viejas con el mismo lugar el mismo día (la web anterior lo permitía):
  // la segunda se migra sin ocupar el lugar para que el predio decida a mano. Se mira
  // antes de insertar para no gastar números de reserva en intentos rechazados.
  const pedidos = unidadesLegado(solicitud)
  const tomados = pedidos.length ? [...(await ocupadosEntre(solicitud.desde, solicitud.hasta, pedidos))] : []
  const creada = await crearReserva({
    ...reservaDesdeLegado(solicitud),
    origen: "LEGADO",
    token: fila.id,
    creadaEn: fila.createdAt,
    asignar: () => (tomados.length ? [] : pedidos),
  })
  if ("sinLugar" in creada) throw new Error(`No se pudo migrar ${solicitud.codigo}`)
  if (tomados.length) resumen.superpuestas.push(`${solicitud.codigo} (${tomados.join(", ")})`)
  resumen.migradas += 1
}

console.log(`Solicitudes en la tabla vieja: ${filas.length}`)
console.log(`Migradas ahora: ${resumen.migradas} · ya estaban: ${resumen.yaEstaban}`)
if (resumen.sinSolicitud.length) {
  console.log(`Sin solicitud adjunta (consultas del formulario viejo, no se migran): ${resumen.sinSolicitud.join(", ")}`)
}
if (resumen.superpuestas.length) {
  console.log(`Migradas sin ocupar el lugar porque ya estaba tomado: ${resumen.superpuestas.join("; ")}`)
}
await prisma.$disconnect()
