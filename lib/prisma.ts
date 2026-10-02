import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Falta DATABASE_URL")
  }
  const adapter = new PrismaMariaDb(url)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
