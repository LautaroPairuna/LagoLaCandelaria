import type { Prisma } from "@/generated/prisma/client"

export type AccionDeCaja = "cobro" | "cobro anulado" | "movimiento" | "movimiento borrado"

/// Deja asentado quién hizo qué con la plata. Va dentro de la misma transacción que el
/// cambio, así no queda un cobro sin registro ni un registro sin cobro.
export function registrarActividad(
  tx: Prisma.TransactionClient,
  datos: { usuario: string; accion: AccionDeCaja; detalle: string; reservaId?: number; monto?: number },
) {
  return tx.actividad.create({
    data: { usuario: datos.usuario.slice(0, 80), accion: datos.accion, detalle: datos.detalle.slice(0, 255), reservaId: datos.reservaId ?? null, monto: datos.monto ?? null },
  })
}
