import { useSyncExternalStore } from "react"
import { toast } from "sonner"

import type { Fallo } from "@/lib/errores"

const sinConexion = "Parece que se cortó la conexión. Revisá internet y probá de nuevo."
const sinRespuesta = "No pudimos comunicarnos con el servidor. Recargá la página y probá de nuevo."

/// Cuando el pedido ni siquiera llega (sin internet, o la página quedó vieja después de
/// una actualización del sitio) la acción tira en el navegador en vez de devolver un fallo.
export function falloDeRed(): Fallo {
  return { ok: false, error: typeof navigator !== "undefined" && !navigator.onLine ? sinConexion : sinRespuesta }
}

export async function llamar<R extends { ok: true } | Fallo>(tarea: () => Promise<R>): Promise<R | Fallo> {
  try {
    return await tarea()
  } catch {
    return falloDeRed()
  }
}

export function avisarError(mensaje: string, opciones?: { id?: string; reintentar?: () => void }) {
  toast.error(mensaje, {
    id: opciones?.id,
    duration: 9000,
    action: opciones?.reintentar ? { label: "Reintentar", onClick: opciones.reintentar } : undefined,
  })
}

export function avisarRevisar(mensaje: string, id?: string) {
  toast.warning(mensaje, { id, duration: 7000 })
}

export function avisarExito(mensaje: string) {
  toast.success(mensaje)
}

/// Corre una Server Action y cuenta con un toast cómo salió.
export async function conAviso<R extends { ok: true } | Fallo>(
  tarea: () => Promise<R>,
  exito: string | ((resultado: Extract<R, { ok: true }>) => string),
): Promise<R | Fallo> {
  const resultado = await llamar(tarea)
  if (resultado.ok) avisarExito(typeof exito === "string" ? exito : exito(resultado as Extract<R, { ok: true }>))
  else avisarError(resultado.error)
  return resultado
}

/// Con errores por campo, el toast resume y el foco salta al primero marcado.
export function irAlPrimerCampo(campos: Record<string, string> | undefined) {
  const primero = Object.keys(campos ?? {})[0]
  if (!primero) return
  requestAnimationFrame(() => {
    const campo = document.getElementById(primero)
    campo?.scrollIntoView({ block: "center", behavior: "smooth" })
    campo?.focus({ preventScroll: true })
  })
}

function escucharConexion(avisar: () => void) {
  window.addEventListener("online", avisar)
  window.addEventListener("offline", avisar)
  return () => {
    window.removeEventListener("online", avisar)
    window.removeEventListener("offline", avisar)
  }
}

export function useEnLinea() {
  return useSyncExternalStore(
    escucharConexion,
    () => navigator.onLine,
    () => true,
  )
}
