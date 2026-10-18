"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { guardarAjustes } from "@/lib/ajustes"
import { accion, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { PALAPAS_CARGADAS } from "@/lib/predio/inventario"

const pedido = z.object({
  palapasWeb: z.number("Escribí cuántas palapas.").int("Escribí un número entero.").min(0, "No puede ser negativo.").max(PALAPAS_CARGADAS, `Hay ${PALAPAS_CARGADAS} palapas cargadas.`),
  aliasTransferencia: z.string().trim().max(60, "Es muy largo."),
  titularTransferencia: z.string().trim().max(80, "Es muy largo."),
})

export async function guardarAjustesDelPanel(datos: z.input<typeof pedido>): Promise<Resultado> {
  return accion("guardarAjustesDelPanel", async () => {
    const sesion = await permisoParaAccion("general")
    const ajustes = pedido.parse(datos)
    await guardarAjustes(ajustes)
    revalidatePath("/panel", "layout")
    await anotar(sesion, {
      seccion: "reservas",
      accion: "cambió ajustes",
      detalle: `Palapas por la web: ${ajustes.palapasWeb}. Alias de transferencia: ${ajustes.aliasTransferencia || "sin cargar"}`,
    })
    return { ok: true }
  })
}
