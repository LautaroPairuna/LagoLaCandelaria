export const paneles = [
  { id: "reservas", nombre: "Reservas", href: "/panel/reservas", listo: true },
  { id: "puerta", nombre: "Puerta", href: "/panel/puerta", listo: true },
  { id: "bar", nombre: "Bar", href: "/panel/bar", listo: false },
  { id: "restaurante", nombre: "Restaurante", href: "/panel/restaurante", listo: false },
  { id: "general", nombre: "General", href: "/panel/general", listo: false },
] as const

export type PanelId = (typeof paneles)[number]["id"]
export const ROLES = ["admin", "reservas", "puerta", "bar", "restaurante"] as const
export type Rol = (typeof ROLES)[number]

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
  return panel !== "general" && roles.includes(panel)
}

export function panelesDe(rol: string | null | undefined) {
  return paneles.filter((panel) => puedeVer(rol, panel.id))
}
