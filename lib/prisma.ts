import "server-only"

import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Pool de 5 que cierra lo que no usa: el driver, por defecto, abre 10 y las deja
// abiertas aunque no se usen (minimumIdle = connectionLimit). Con esto se cierran
// al minuto sin uso, porque la base es compartida con otros sitios. Lo que ya
// venga en DATABASE_URL tiene prioridad.
// allowPublicKeyRetrieval: MySQL 8 sin SSL; sin esto, después de reiniciar MySQL
// (caché de autenticación vacía) el driver no se puede autenticar.
const POOL = {
  connectionLimit: "5",
  minimumIdle: "0",
  idleTimeout: "60",
  allowPublicKeyRetrieval: "true",
}

function conPool(raw: string): string {
  const url = new URL(raw)
  for (const [clave, valor] of Object.entries(POOL)) {
    if (!url.searchParams.has(clave)) url.searchParams.set(clave, valor)
  }
  return url.toString()
}

export function db() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Falta DATABASE_URL")
  }
  const cliente = new PrismaClient({ adapter: new PrismaMariaDb(conPool(url)) })
  globalForPrisma.prisma = cliente
  return cliente
}
