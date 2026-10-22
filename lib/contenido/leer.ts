import "server-only"

import { connection } from "next/server"
import { cache } from "react"

import { esquemaDe } from "@/lib/contenido/campos"
import { aplicarFicha, fichasDeActividades, fichasDeEstadias } from "@/lib/contenido/fichas"
import { seccionesEstudiantilesCon } from "@/lib/contenido/estudiantiles"
import { armarContenido, definicionDe, registro, type ContenidoDelSitio } from "@/lib/contenido/registro"
import { db } from "@/lib/prisma"

export type { ContenidoDelSitio }

export function validarSeccion(clave: string, valor: unknown) {
  const definicion = definicionDe(clave)
  if (!definicion) throw new Error(`Sección desconocida: ${clave}`)
  return esquemaDe(definicion.campos).parse(valor) as unknown
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
  const validos = new Map<string, unknown>()
  for (const fila of filas) {
    const definicion = definicionDe(fila.clave)
    if (!definicion) continue
    const leido = esquemaDe(definicion.campos).safeParse(fila.valor)
    if (leido.success) validos.set(fila.clave, leido.data)
    else console.error(`[contenido] la sección ${fila.clave} guardada no es válida, se muestra la de fábrica`)
  }
  return armarContenido(validos)
})

/// Las fichas con lo editado encima, en el orden del código.
export async function fichasDelSitio() {
  const { fichas } = await contenidoDelSitio()
  return {
    actividades: fichasDeActividades.map((ficha) => aplicarFicha(ficha, fichas[ficha.slug])),
    estadias: fichasDeEstadias.map((ficha) => aplicarFicha(ficha, fichas[ficha.slug])),
  }
}

export async function seccionesEstudiantilesDelSitio() {
  return seccionesEstudiantilesCon((await contenidoDelSitio()).estudiantiles)
}

export async function guardarSeccion(clave: string, valor: unknown, usuario: string) {
  await db().contenido.upsert({
    where: { clave },
    create: { clave, valor: valor as object, actualizadoPor: usuario },
    update: { valor: valor as object, actualizadoPor: usuario },
  })
}

export async function restaurarSeccion(clave: string) {
  await db().contenido.deleteMany({ where: { clave } })
}

export async function ultimosCambios() {
  const filas = await db().contenido.findMany({ select: { clave: true, actualizadoEn: true, actualizadoPor: true } })
  return new Map(filas.map((fila) => [fila.clave, fila]))
}

export { registro }
