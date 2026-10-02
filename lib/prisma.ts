import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function db() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Falta DATABASE_URL")
  }
  const cliente = new PrismaClient({ adapter: new PrismaMariaDb(url) })
  globalForPrisma.prisma = cliente
  return cliente
}
