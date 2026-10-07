export const ROLES = ["admin", "reservas", "puerta", "bar", "restaurante"] as const
export type Rol = (typeof ROLES)[number]

// Cada panel se habilita con un rol; la administración ve todos.
export const paneles = [
  { id: "ocupacion", nombre: "Ocupación", href: "/panel/ocupacion", listo: true, rol: "reservas" },
  { id: "reservas", nombre: "Reservas", href: "/panel/reservas", listo: true, rol: "reservas" },
  { id: "lugares", nombre: "Lugares", href: "/panel/lugares", listo: true, rol: "reservas" },
  { id: "puerta", nombre: "Puerta", href: "/panel/puerta", listo: true, rol: "puerta" },
  { id: "caja", nombre: "Caja", href: "/panel/caja", listo: true, rol: "admin" },
  { id: "bar", nombre: "Bar", href: "/panel/bar", listo: false, rol: "bar" },
  { id: "restaurante", nombre: "Restaurante", href: "/panel/restaurante", listo: true, rol: "restaurante" },
  { id: "general", nombre: "General", href: "/panel/general", listo: true, rol: "admin" },
] as const satisfies readonly { id: string; nombre: string; href: string; listo: boolean; rol: Rol }[]

export type PanelId = (typeof paneles)[number]["id"]

// Better Auth guarda los roles de un usuario separados por coma.
export function rolesDe(rol: string | null | undefined): Rol[] {
  return (rol ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is Rol => (ROLES as readonly string[]).includes(item))
}

export function puedeVer(rol: string | null | undefined, panel: PanelId) {
  const roles = rolesDe(rol)
  if (roles.includes("admin")) return true
  const requerido: Rol = paneles.find((item) => item.id === panel)!.rol
  return roles.includes(requerido)
}

export function panelesDe(rol: string | null | undefined) {
  return paneles.filter((panel) => puedeVer(rol, panel.id))
}

export const etiquetaDeRol: Record<Rol, string> = {
  admin: "Administración",
  reservas: "Reservas",
  puerta: "Puerta",
  bar: "Bar",
  restaurante: "Restaurante",
}
