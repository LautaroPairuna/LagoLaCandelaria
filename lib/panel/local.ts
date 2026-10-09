import type { EstadoCuenta, FormaPago, Local } from "@/generated/prisma/enums"

export type { Local }

export type DatosDelLocal = {
  id: Local
  slug: "restaurante" | "bar"
  nombre: string
  panel: "restaurante" | "bar"
  base: string
  /// Las mesas que se ofrecen al abrir una cuenta. El bar no tiene mesas fijas: se
  /// escribe dónde está (barra, mesa del deck, sombrilla).
  mesas: string[]
}

export const locales: Record<Local, DatosDelLocal> = {
  RESTAURANTE: {
    id: "RESTAURANTE",
    slug: "restaurante",
    nombre: "Restaurante",
    panel: "restaurante",
    base: "/panel/restaurante",
    mesas: Array.from({ length: 9 }, (_, indice) => `Mesa ${indice + 1}`),
  },
  BAR: { id: "BAR", slug: "bar", nombre: "Bar", panel: "bar", base: "/panel/bar", mesas: ["Barra"] },
}

export function localDelSlug(slug: string): DatosDelLocal | undefined {
  return Object.values(locales).find((local) => local.slug === slug)
}

type ItemConPrecio = { precio: number; cantidad: number }

export function totalDeCuenta(items: ItemConPrecio[]) {
  return items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
}

type CuentaParaResumen = { estado: EstadoCuenta; forma: FormaPago | null; items: ItemConPrecio[] }

/// Las cuentas del día: lo cobrado (y cómo) y lo que falta cobrar.
export function resumenDeCuentas(cuentas: CuentaParaResumen[]) {
  const cobrado: Record<FormaPago, number> = { EFECTIVO: 0, DEBITO: 0, TRANSFERENCIA: 0 }
  let pendiente = 0
  let abiertas = 0
  for (const cuenta of cuentas) {
    const total = totalDeCuenta(cuenta.items)
    if (cuenta.estado === "COBRADA" && cuenta.forma) cobrado[cuenta.forma] += total
    else {
      pendiente += total
      abiertas += 1
    }
  }
  return { cobrado, totalCobrado: cobrado.EFECTIVO + cobrado.DEBITO + cobrado.TRANSFERENCIA, pendiente, abiertas }
}

/// Agrupa la carta por categoría, en el orden en que se cargaron las categorías.
export function porCategoria<T extends { categoria: string }>(items: T[]) {
  const grupos = new Map<string, T[]>()
  for (const item of items) grupos.set(item.categoria, [...(grupos.get(item.categoria) ?? []), item])
  return [...grupos].map(([categoria, lista]) => ({ categoria, items: lista }))
}
