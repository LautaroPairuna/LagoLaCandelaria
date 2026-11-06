export const ROLES = ["admin", "reservas", "puerta", "bar", "restaurante", "caja", "profesor"] as const
export type Rol = (typeof ROLES)[number]

// Cada panel se habilita con un rol (o varios); la administración ve todos. Reservas y
// Lugares ya no van en el menú, porque están dentro de Puerta, pero sus permisos siguen
// valiendo: confirmar y cancelar reservas pide el rol reservas.
export const paneles = [
  { id: "ocupacion", nombre: "Ocupación", href: "/panel/ocupacion", listo: true, rol: "reservas" },
  { id: "reservas", nombre: "Reservas", href: "/panel/puerta", listo: true, rol: "reservas", enMenu: false },
  { id: "lugares", nombre: "Lugares", href: "/panel/puerta/lugares", listo: true, rol: "reservas", enMenu: false },
  { id: "puerta", nombre: "Puerta", href: "/panel/puerta", listo: true, rol: ["puerta", "reservas"] },
  { id: "clientes", nombre: "Clientes y WhatsApp", href: "/panel/clientes", listo: true, rol: "reservas" },
  { id: "caja", nombre: "Caja", href: "/panel/caja", listo: true, rol: "caja" },
  { id: "bar", nombre: "Bar", href: "/panel/bar", listo: true, rol: "bar" },
  { id: "restaurante", nombre: "Restaurante", href: "/panel/restaurante", listo: true, rol: "restaurante" },
  { id: "actividades", nombre: "Actividades", href: "/panel/actividades", listo: true, rol: "profesor" },
  { id: "sitio", nombre: "Sitio web", href: "/panel/sitio", listo: true, rol: "admin" },
  { id: "general", nombre: "General", href: "/panel/general", listo: true, rol: "admin" },
] as const satisfies readonly { id: string; nombre: string; href: string; listo: boolean; rol: Rol | readonly Rol[]; enMenu?: boolean }[]

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
  const requerido: Rol | readonly Rol[] = paneles.find((item) => item.id === panel)!.rol
  return (typeof requerido === "string" ? [requerido] : requerido).some((cual) => roles.includes(cual))
}

/// Los paneles del menú que puede abrir.
export function panelesDe(rol: string | null | undefined) {
  return paneles.filter((panel) => !("enMenu" in panel && panel.enMenu === false) && puedeVer(rol, panel.id))
}

export const etiquetaDeRol: Record<Rol, string> = {
  admin: "Administración",
  reservas: "Reservas",
  puerta: "Puerta",
  bar: "Bar",
  restaurante: "Restaurante",
  caja: "Caja",
  profesor: "Profesor",
}
