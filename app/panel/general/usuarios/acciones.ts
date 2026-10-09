"use server"

import { randomBytes } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { accion, exigir, validar, type Resultado } from "@/lib/errores"
import { ROLES } from "@/lib/panel/roles"
import { permisoParaAccion } from "@/lib/panel/sesion"

export type ResultadoUsuario = Resultado<{ password?: string }>

const roles = z.array(z.enum(ROLES)).min(1, "Elegí al menos un panel para que pueda entrar.")
const idDeUsuario = z.string().min(1).max(64)

function contrasenaNueva() {
  return randomBytes(12).toString("base64url")
}

function comoAdmin(nombre: string, tarea: (cabeceras: Headers, yo: string) => Promise<ResultadoUsuario>) {
  return accion(nombre, async () => {
    const sesion = await permisoParaAccion("general")
    return tarea(await headers(), sesion.user.id)
  })
}

const nuevoUsuario = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre de la persona.").max(80, "Ese nombre es muy largo."),
  email: z.string().trim().toLowerCase().email("Ese correo no parece completo: revisá que tenga @ y el dominio.").max(120, "Ese correo es muy largo."),
  roles,
})

export async function crearUsuario(datos: z.input<typeof nuevoUsuario>): Promise<ResultadoUsuario> {
  return comoAdmin("crearUsuario", async (cabeceras) => {
    const entrada = validar(nuevoUsuario, datos)
    const password = contrasenaNueva()
    await auth().api.createUser({
      body: { name: entrada.nombre, email: entrada.email, password, role: entrada.roles },
      headers: cabeceras,
    })
    revalidatePath("/panel/general/usuarios")
    return { ok: true, password }
  })
}

export async function cambiarRoles(userId: string, nuevos: string[]): Promise<ResultadoUsuario> {
  return comoAdmin("cambiarRoles", async (cabeceras, yo) => {
    const entrada = validar(z.object({ userId: idDeUsuario, roles }), { userId, roles: nuevos })
    exigir(
      entrada.userId !== yo || entrada.roles.includes("admin"),
      "No podés sacarte la administración a vos mismo: pedíselo a otra persona que sea administradora.",
    )
    await auth().api.setRole({ body: { userId: entrada.userId, role: entrada.roles }, headers: cabeceras })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}

export async function generarContrasena(userId: string): Promise<ResultadoUsuario> {
  return comoAdmin("generarContrasena", async (cabeceras) => {
    const id = idDeUsuario.parse(userId)
    const password = contrasenaNueva()
    await auth().api.setUserPassword({ body: { userId: id, newPassword: password }, headers: cabeceras })
    await auth().api.revokeUserSessions({ body: { userId: id }, headers: cabeceras })
    return { ok: true, password }
  })
}

export async function cambiarAcceso(userId: string, habilitado: boolean): Promise<ResultadoUsuario> {
  return comoAdmin("cambiarAcceso", async (cabeceras, yo) => {
    const id = idDeUsuario.parse(userId)
    exigir(id !== yo, "No podés deshabilitar tu propio usuario.")
    if (habilitado) await auth().api.unbanUser({ body: { userId: id }, headers: cabeceras })
    else await auth().api.banUser({ body: { userId: id, banReason: "Deshabilitado desde el panel" }, headers: cabeceras })
    revalidatePath("/panel/general/usuarios")
    return { ok: true }
  })
}
