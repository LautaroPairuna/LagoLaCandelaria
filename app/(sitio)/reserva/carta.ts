"use server"

import { menuDelLocal } from "@/lib/panel/cuentas"

export type CartaPublica = {
  id: number
  categoria: string
  nombre: string
  descripcion: string | null
  precio: number
}

export async function cartaDelRestaurante(): Promise<CartaPublica[]> {
  try {
    const items = await menuDelLocal("RESTAURANTE", true)
    return items.map(({ id, categoria, nombre, descripcion, precio }) => ({ id, categoria, nombre, descripcion, precio }))
  } catch {
    return []
  }
}
