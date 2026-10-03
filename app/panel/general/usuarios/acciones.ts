"use server"

import { randomBytes } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { auth, errorDeAuth } from "@/lib/auth"
import { ROLES } from "@/lib/panel/roles"
import { permisoParaAccion } from "@/lib/panel/sesion"

export type ResultadoUsuario = { ok: true; password?: string } | { ok: false; error: string }

const roles = z.array(z.enum(ROLES)).min(1, "Elegí al menos un panel.")
const idDeUsuario = z.string().min(1).max(64)

function contrasenaNueva() {
  return randomBytes(12).toString("base64url")
}

async function comoAdmin<T>(tarea: (cabeceras: Headers, yo: string) => Promise<T>): Promise<T | ResultadoUsuario> {
  const sesion = await permisoParaAccion("general")
  try {
    return await tarea(await headers(), sesion.user.id)
  } catch (error) {
    const fallo = errorDeAuth(error)
    if (!fallo) throw error
    return { ok: false, error: /exist/i.test(fallo.message) ? "Ya hay un usuario con ese correo." : "No se pudo guardar el cambio." }
  }
}

const nuevoUsuario = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Ese correo no parece completo.").max(120),
  roles,
})

export async function crearUsuario(datos: z.input<typeof nuevoUsuario>): Promise<ResultadoUsuario> {
  const entrada = nuevoUsuario.safeParse(datos)
  if (!entrada.success) return { ok: false, error: entrada.error.issues[0]?.message ?? "Revisá los datos." }
  return comoAdmin(async (cabeceras) => {
    const password = contrasenaNueva()
    await auth().api.createUser({
      body: { name: entrada.data.nombre, email: entrada.data.email, password, role: entrada.data.roles },
      headers: cabeceras,
    })
    revalidatePath("/panel/general/usuarios")
    return { ok: true, password }
  })
}

export async function cambiarRoles(userId: string, nuevos: string[]): Promise<ResultadoUsuario> {
  const entrada = z.object({ userId: idDeUsuario, roles }).safeParse({ userId, roles: nuevos })
  if (!entrada.success) return { ok: false, error: entrada.error.issues[0]?.message ?? "Revisá los datos." }
  return comoAdmin(async (cabeceras, yo) => {
    if (entrada.data.userId === yo && !entrada.data.roles.includes("admin")) {
      return { ok: false, error: "No podés quitarte la administración a vos mismo." }
    }
    await auth().api.setRole({ body: { userId: entrada.data.userId, role: entrada.data.roles }, headers: cabeceras })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}

export async function generarContrasena(userId: string): Promise<ResultadoUsuario> {
  const id = idDeUsuario.parse(userId)
  return comoAdmin(async (cabeceras) => {
    const password = contrasenaNueva()
    await auth().api.setUserPassword({ body: { userId: id, newPassword: password }, headers: cabeceras })
    await auth().api.revokeUserSessions({ body: { userId: id }, headers: cabeceras })
    return { ok: true, password }
  })
}

export async function cambiarAcceso(userId: string, habilitado: boolean): Promise<ResultadoUsuario> {
  const id = idDeUsuario.parse(userId)
  return comoAdmin(async (cabeceras, yo) => {
    if (id === yo) return { ok: false, error: "No podés deshabilitar tu propio usuario." }
    if (habilitado) await auth().api.unbanUser({ body: { userId: id }, headers: cabeceras })
    else await auth().api.banUser({ body: { userId: id, banReason: "Deshabilitado desde el panel" }, headers: cabeceras })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}
