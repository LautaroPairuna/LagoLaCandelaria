import "dotenv/config"

import { aFechaDb } from "@/lib/predio/fechas"
import { feriados2026 } from "@/lib/predio/feriados"
import { inventario } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"

const prisma = db()

await prisma.$transaction([
  ...inventario.map((unidad) =>
    prisma.unidad.upsert({
      where: { id: unidad.id },
      create: { ...unidad, activa: true },
      update: { ...unidad, activa: true },
    }),
  ),
  prisma.unidad.updateMany({
    where: { id: { notIn: inventario.map((unidad) => unidad.id) } },
    data: { activa: false },
  }),
  ...feriados2026.map((dia) =>
    prisma.diaEspecial.upsert({
      where: { fecha: aFechaDb(dia.fecha) },
      create: { fecha: aFechaDb(dia.fecha), tipo: dia.tipo, motivo: dia.motivo },
      update: { tipo: dia.tipo, motivo: dia.motivo },
    }),
  ),
])

const unidades = await prisma.unidad.groupBy({ by: ["tipo"], where: { activa: true }, _count: true })
console.log("Unidades activas:", Object.fromEntries(unidades.map((fila) => [fila.tipo, fila._count])))
console.log("Días especiales:", await prisma.diaEspecial.count())
await prisma.$disconnect()
