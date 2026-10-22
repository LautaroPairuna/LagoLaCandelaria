"use server"

import { revalidatePath } from "next/cache"

import { guardarSeccion, restaurarSeccion, validarSeccion } from "@/lib/contenido/leer"
import { definicionDe } from "@/lib/contenido/registro"
import { accion, ErrorHumano, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"

export async function guardarContenido(clave: string, valor: unknown): Promise<Resultado<{ valor: unknown }>> {
  return accion("guardarContenido", async () => {
    const sesion = await permisoParaAccion("sitio")
    const definicion = definicionDe(clave)
    if (!definicion) throw new ErrorHumano("Esa sección del sitio no existe. Actualizá la página.")
    const validado = validarSeccion(clave, valor)
    await guardarSeccion(clave, validado, sesion.user.name)
    revalidatePath("/", "layout")
    await anotar(sesion, { seccion: "sitio", accion: "editó el sitio", detalle: definicion.nombre })
    return { ok: true, valor: validado }
  })
}

export async function restaurarContenido(clave: string): Promise<Resultado> {
  return accion("restaurarContenido", async () => {
    const sesion = await permisoParaAccion("sitio")
    const definicion = definicionDe(clave)
    if (!definicion) throw new ErrorHumano("Esa sección del sitio no existe. Actualizá la página.")
    await restaurarSeccion(clave)
    revalidatePath("/", "layout")
    await anotar(sesion, { seccion: "sitio", accion: "restauró el sitio", detalle: `${definicion.nombre}: volvió al texto original` })
    return { ok: true }
  })
}
