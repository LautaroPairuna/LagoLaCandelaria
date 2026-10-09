"use server"

import { randomBytes } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { accion, exigir, validar, type Resultado } from "@/lib/errores"
import { esActividadConProfesor } from "@/lib/panel/actividades"
import { ROLES } from "@/lib/panel/roles"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

export type ResultadoUsuario = Resultado<{ password?: string }>

const roles = z.array(z.enum(ROLES)).min(1, "Elegí al menos un panel para que pueda entrar.")
const idDeUsuario = z.string().min(1).max(64)
const actividades = z.array(z.string().refine(esActividadConProfesor, "Esa actividad no existe.")).max(20).default([])

/// Las actividades a cargo de un profesor. Si deja de ser profesor, se le sacan todas.
async function guardarActividades(userId: string, roles: string[], elegidas: string[]) {
  const lista = roles.includes("profesor") ? [...new Set(elegidas)] : []
  await db().$transaction([
    db().profesorDeActividad.deleteMany({ where: { userId } }),
    db().profesorDeActividad.createMany({ data: lista.map((actividad) => ({ userId, actividad })) }),
  ])
}

function contrasenaNueva() {
  return randomBytes(12).toString("base64url")
}

type Sesion = Awaited<ReturnType<typeof permisoParaAccion>>

function comoAdmin(nombre: string, tarea: (cabeceras: Headers, yo: string, sesion: Sesion) => Promise<ResultadoUsuario>) {
  return accion(nombre, async () => {
    const sesion = await permisoParaAccion("general")
    return tarea(await headers(), sesion.user.id, sesion)
  })
}

async function nombreDe(userId: string) {
  const usuario = await db().user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
  return usuario ? `${usuario.name} (${usuario.email})` : "un usuario"
}

const nuevoUsuario = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre de la persona.").max(80, "Ese nombre es muy largo."),
  email: z.string().trim().toLowerCase().email("Ese correo no parece completo: revisá que tenga @ y el dominio.").max(120, "Ese correo es muy largo."),
  roles,
  actividades,
})

export async function crearUsuario(datos: z.input<typeof nuevoUsuario>): Promise<ResultadoUsuario> {
  return comoAdmin("crearUsuario", async (cabeceras, _yo, sesion) => {
    const entrada = validar(nuevoUsuario, datos)
    const password = contrasenaNueva()
    exigir(!entrada.roles.includes("profesor") || entrada.actividades.length > 0, "Elegí qué actividad tiene a cargo el profesor.")
    const creado = await auth().api.createUser({
      body: { name: entrada.nombre, email: entrada.email, password, role: entrada.roles },
      headers: cabeceras,
    })
    await guardarActividades(creado.user.id, entrada.roles, entrada.actividades)
    await anotar(sesion, { seccion: "usuarios", accion: "creó usuario", detalle: `Creó el usuario de ${entrada.nombre} (${entrada.email}) con ${entrada.roles.join(", ")}` })
    revalidatePath("/panel/general/usuarios")
    return { ok: true, password }
  })
}

export async function cambiarRoles(userId: string, nuevos: string[], elegidas: string[] = []): Promise<ResultadoUsuario> {
  return comoAdmin("cambiarRoles", async (cabeceras, yo, sesion) => {
    const entrada = validar(z.object({ userId: idDeUsuario, roles, actividades }), { userId, roles: nuevos, actividades: elegidas })
    exigir(!entrada.roles.includes("profesor") || entrada.actividades.length > 0, "Elegí qué actividad tiene a cargo el profesor.")
    exigir(
      entrada.userId !== yo || entrada.roles.includes("admin"),
      "No podés sacarte la administración a vos mismo: pedíselo a otra persona que sea administradora.",
    )
    await auth().api.setRole({ body: { userId: entrada.userId, role: entrada.roles }, headers: cabeceras })
    await guardarActividades(entrada.userId, entrada.roles, entrada.actividades)
    await anotar(sesion, {
      seccion: "usuarios",
      accion: "cambió permisos",
      detalle: `Dejó a ${await nombreDe(entrada.userId)} con ${entrada.roles.join(", ")}${entrada.roles.includes("profesor") ? ` (actividades: ${entrada.actividades.join(", ")})` : ""}`,
    })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}

export async function generarContrasena(userId: string): Promise<ResultadoUsuario> {
  return comoAdmin("generarContrasena", async (cabeceras, _yo, sesion) => {
    const id = idDeUsuario.parse(userId)
    const password = contrasenaNueva()
    await auth().api.setUserPassword({ body: { userId: id, newPassword: password }, headers: cabeceras })
    await auth().api.revokeUserSessions({ body: { userId: id }, headers: cabeceras })
    await anotar(sesion, { seccion: "usuarios", accion: "nueva contraseña", detalle: `Generó una contraseña nueva para ${await nombreDe(id)}` })
    return { ok: true, password }
  })
}

export async function cambiarAcceso(userId: string, habilitado: boolean): Promise<ResultadoUsuario> {
  return comoAdmin("cambiarAcceso", async (cabeceras, yo, sesion) => {
    const id = idDeUsuario.parse(userId)
    exigir(id !== yo, "No podés deshabilitar tu propio usuario.")
    if (habilitado) await auth().api.unbanUser({ body: { userId: id }, headers: cabeceras })
    else await auth().api.banUser({ body: { userId: id, banReason: "Deshabilitado desde el panel" }, headers: cabeceras })
    await anotar(sesion, { seccion: "usuarios", accion: habilitado ? "habilitó usuario" : "deshabilitó usuario", detalle: `${habilitado ? "Habilitó" : "Deshabilitó"} a ${await nombreDe(id)}` })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}
