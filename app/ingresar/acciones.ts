"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { auth, errorDeAuth } from "@/lib/auth"

const credenciales = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
})

export type EstadoIngreso = { error?: string }

export async function ingresar(_previo: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const entrada = credenciales.safeParse({ email: datos.get("email"), password: datos.get("password") })
  if (!entrada.success) return { error: "Revisá el correo y la contraseña." }

  try {
    await auth().api.signInEmail({ body: entrada.data, headers: await headers() })
  } catch (error) {
    const fallo = errorDeAuth(error)
    if (!fallo) throw error
    if (fallo.status === "TOO_MANY_REQUESTS") return { error: "Demasiados intentos. Esperá un minuto." }
    if (/banned/i.test(fallo.message)) return { error: "Tu usuario está deshabilitado. Hablá con la administración." }
    return { error: "El correo o la contraseña no coinciden." }
  }
  redirect("/panel")
}

export async function salir() {
  await auth().api.signOut({ headers: await headers() })
  redirect("/ingresar")
}
