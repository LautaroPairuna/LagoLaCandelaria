"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

/// El día de la pantalla: al elegir una fecha se va directo a ese día, sin botón. Se
/// conservan los filtros de la dirección; los de `sacar` se quitan (por ejemplo, el lugar
/// elegido, que era de otro día).
export function ElegirFecha({ fecha, sacar = [] }: { fecha: string; sacar?: string[] }) {
  const router = useRouter()
  const ruta = usePathname()
  const params = useSearchParams()

  function ir(nueva: string) {
    // Mientras se escribe a mano el valor queda vacío: se navega solo con una fecha completa.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nueva) || nueva === fecha) return
    const nuevos = new URLSearchParams(params.toString())
    for (const clave of sacar) nuevos.delete(clave)
    nuevos.set("fecha", nueva)
    router.push(`${ruta}?${nuevos}`)
  }

  return (
    <input
      key={fecha}
      type="date"
      defaultValue={fecha}
      onChange={(evento) => ir(evento.target.value)}
      aria-label="Elegir otro día"
      className="h-10 rounded-xl border border-panel-line bg-white px-3 text-sm md:ml-3"
    />
  )
}
