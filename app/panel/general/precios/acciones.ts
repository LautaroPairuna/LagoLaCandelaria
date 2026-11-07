"use server"

import { revalidatePath } from "next/cache"

import { accion, validar, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { esquemaDePrecios, guardarPrecios } from "@/lib/precios"
import { pesos, type Precios } from "@/lib/predio/tarifas"

/// Guarda los precios. Rigen para las reservas nuevas y las que se modifiquen; las que ya
/// están guardadas conservan el precio con el que se tomaron.
export async function guardarPreciosDelPanel(pedido: Precios): Promise<Resultado> {
  return accion("guardarPreciosDelPanel", async () => {
    const sesion = await permisoParaAccion("general")
    const precios = validar(esquemaDePrecios, pedido)
    await guardarPrecios(precios)
    revalidatePath("/", "layout")
    await anotar(sesion, {
      seccion: "sitio",
      accion: "cambió precios",
      detalle: `Entrada finde ${pesos(precios.entrada.finde.adulto)} / ${pesos(precios.entrada.finde.menor)}, semana ${pesos(precios.entrada.semana.adulto)} / ${pesos(precios.entrada.semana.menor)}; nado ${pesos(precios.nado.finde)} / ${pesos(precios.nado.semana)}; bungalow ${pesos(precios.bungalow)}`.slice(0, 255),
    })
    return { ok: true }
  })
}
