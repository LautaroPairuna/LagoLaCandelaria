import { PALAPAS_CARGADAS, PALAPAS_WEB_POR_DEFECTO } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"

/// Lo que la administración puede cambiar desde el panel sin tocar el código.
export type Ajustes = {
  /// Cuántas palapas se ofrecen por la web: las primeras N. El resto se usa por orden de
  /// llegada en el predio.
  palapasWeb: number
  /// Datos para transferir el pago anticipado de los bungalows.
  aliasTransferencia: string
  titularTransferencia: string
}

export const ajustesPorDefecto: Ajustes = { palapasWeb: PALAPAS_WEB_POR_DEFECTO, aliasTransferencia: "", titularTransferencia: "" }

function leer(clave: keyof Ajustes, valor: string | undefined): Ajustes[keyof Ajustes] {
  if (valor === undefined) return ajustesPorDefecto[clave]
  if (clave === "palapasWeb") {
    const numero = Number(valor)
    return Number.isInteger(numero) && numero >= 0 && numero <= PALAPAS_CARGADAS ? numero : ajustesPorDefecto.palapasWeb
  }
  return valor
}

export async function leerAjustes(): Promise<Ajustes> {
  const filas = await db().ajuste.findMany()
  const valores = new Map(filas.map((fila) => [fila.clave, fila.valor]))
  return Object.fromEntries((Object.keys(ajustesPorDefecto) as (keyof Ajustes)[]).map((clave) => [clave, leer(clave, valores.get(clave))])) as Ajustes
}

export async function guardarAjustes(cambios: Partial<Ajustes>) {
  await db().$transaction(
    Object.entries(cambios).map(([clave, valor]) =>
      db().ajuste.upsert({ where: { clave }, create: { clave, valor: String(valor) }, update: { valor: String(valor) } }),
    ),
  )
}
