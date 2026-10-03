import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { createAccessControl } from "better-auth/plugins/access"
import { admin } from "better-auth/plugins/admin"
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access"

import { db } from "@/lib/prisma"
import { urlSitio } from "@/lib/url-sitio"

const ac = createAccessControl(defaultStatements)

function crearAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? urlSitio,
    database: prismaAdapter(db(), { provider: "mysql" }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 10 },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60 },
    rateLimit: { enabled: true },
    plugins: [
      admin({
        ac,
        roles: {
          admin: adminAc,
          reservas: ac.newRole({}),
          puerta: ac.newRole({}),
          bar: ac.newRole({}),
          restaurante: ac.newRole({}),
        },
        adminRoles: ["admin"],
        defaultRole: "reservas",
      }),
      nextCookies(),
    ],
  })
}

type Auth = ReturnType<typeof crearAuth>

const globalParaAuth = globalThis as unknown as { auth?: Auth }

// Se crea al primer uso, igual que Prisma, para que el build no pida la base ni el secreto.
export function auth() {
  globalParaAuth.auth ??= crearAuth()
  return globalParaAuth.auth
}
