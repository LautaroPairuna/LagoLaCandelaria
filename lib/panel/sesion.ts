import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { ErrorHumano, mensajes } from "@/lib/errores"
import { puedeVer, type PanelId } from "@/lib/panel/roles"

export async function sesionActual() {
  const cabeceras = await headers()
  return auth().api.getSession({ headers: cabeceras })
}

export async function exigirSesion() {
  const sesion = await sesionActual()
  if (!sesion) redirect("/ingresar")
  return sesion
}

// Con varios paneles alcanza con poder ver alguno.
export async function exigirPanel(...paneles: PanelId[]) {
  const sesion = await exigirSesion()
  if (!paneles.some((panel) => puedeVer(sesion.user.role, panel))) redirect("/panel")
  return sesion
}

// Las Server Actions son endpoints públicos: cada una vuelve a verificar sesión y rol.
export async function permisoParaAccion(panel: PanelId) {
  const sesion = await sesionActual()
  if (!sesion || !puedeVer(sesion.user.role, panel)) throw new ErrorHumano(mensajes.sinPermiso)
  return sesion
}
