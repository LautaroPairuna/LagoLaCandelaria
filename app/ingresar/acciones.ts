"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { errorDeAuth, humanizar } from "@/lib/errores"

const credenciales = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
})

export type EstadoIngreso = { error?: string }

export async function ingresar(_previo: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const entrada = credenciales.safeParse({ email: datos.get("email"), password: datos.get("password") })
  if (!entrada.success) return { error: "Revisá el correo: tiene que tener @ y el dominio, por ejemplo nombre@gmail.com." }

  try {
    await auth().api.signInEmail({ body: entrada.data, headers: await headers() })
  } catch (error) {
    const fallo = errorDeAuth(error)
    if (fallo?.status === "TOO_MANY_REQUESTS") return { error: "Probaste varias veces seguidas. Esperá un minuto y volvé a intentar." }
    if (fallo && /banned/i.test(fallo.message)) return { error: "Tu usuario está deshabilitado. Hablá con la administración para que te lo habiliten." }
    if (fallo) return { error: "El correo o la contraseña no coinciden. Revisá que no esté activada la mayúscula." }
    console.error(`[ingresar] ${error instanceof Error ? `${error.name}: ${error.message.slice(0, 300)}` : String(error)}`)
    return { error: humanizar(error).error }
  }
  redirect("/panel")
}

export async function salir() {
  await auth().api.signOut({ headers: await headers() })
  redirect("/ingresar")
}
