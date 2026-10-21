import "server-only"

import { connection } from "next/server"
import { cache } from "react"

import { esquemaDe } from "@/lib/contenido/campos"
import { contenidoPorDefecto, secciones, type ClaveDeSeccion, type ContenidoDelSitio } from "@/lib/contenido/secciones"
import { db } from "@/lib/prisma"

const claves = Object.keys(secciones) as ClaveDeSeccion[]

export function esClaveDeSeccion(valor: unknown): valor is ClaveDeSeccion {
  return typeof valor === "string" && (claves as string[]).includes(valor)
}

export function validarSeccion<C extends ClaveDeSeccion>(clave: C, valor: unknown) {
  return esquemaDe(secciones[clave].campos).parse(valor) as ContenidoDelSitio[C]
}

/// Lo guardado desde el panel, sección por sección. Una sección que no se guardó nunca, o
/// que quedó vieja frente a lo que el sitio espera, se muestra con lo que trae el código.
export const contenidoDelSitio = cache(async (): Promise<ContenidoDelSitio> => {
  await connection()
  let filas: { clave: string; valor: unknown }[] = []
  try {
    filas = await db().contenido.findMany({ select: { clave: true, valor: true } })
  } catch (error) {
    console.error(`[contenido] no se pudo leer, se muestra el contenido de fábrica: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`)
  }
  const guardado = new Map(filas.map((fila) => [fila.clave, fila.valor]))
  const contenido = { ...contenidoPorDefecto }
  for (const clave of claves) {
    if (!guardado.has(clave)) continue
    const leido = esquemaDe(secciones[clave].campos).safeParse(guardado.get(clave))
    if (leido.success) Object.assign(contenido, { [clave]: leido.data })
    else console.error(`[contenido] la sección ${clave} guardada no es válida, se muestra la de fábrica`)
  }
  return contenido
})

export async function guardarSeccion<C extends ClaveDeSeccion>(clave: C, valor: ContenidoDelSitio[C], usuario: string) {
  await db().contenido.upsert({
    where: { clave },
    create: { clave, valor, actualizadoPor: usuario },
    update: { valor, actualizadoPor: usuario },
  })
}

export async function restaurarSeccion(clave: ClaveDeSeccion) {
  await db().contenido.deleteMany({ where: { clave } })
}

export async function ultimosCambios() {
  const filas = await db().contenido.findMany({ select: { clave: true, actualizadoEn: true, actualizadoPor: true } })
  return new Map(filas.map((fila) => [fila.clave, fila]))
}
