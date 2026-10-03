import "dotenv/config"

import { randomBytes } from "node:crypto"

import { auth } from "@/lib/auth"
import { ROLES, rolesDe } from "@/lib/panel/roles"
import { db } from "@/lib/prisma"

const [email, nombre, rolesPedidos] = process.argv.slice(2)
const roles = rolesDe(rolesPedidos)

if (!email || !nombre || roles.length === 0) {
  console.error(`Uso: npm run usuario:crear -- correo@dominio.com "Nombre Apellido" ${ROLES.join(",")}`)
  process.exit(1)
}

const password = randomBytes(12).toString("base64url")
await auth().api.createUser({ body: { email: email.toLowerCase(), name: nombre, password, role: roles } })
console.log(`Usuario creado: ${email} (${roles.join(", ")})`)
console.log(`Contraseña inicial: ${password}`)
await db().$disconnect()
