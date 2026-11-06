"use client"

import { Check, ChevronDown, MessageCircle, RotateCcw, X, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react"

import { responderConfirmacion } from "@/app/panel/reservas/acciones"
import { DialogoDeWhatsapp, type Destinatario } from "@/components/panel/enviar-whatsapp"
import { posicionDelMenu } from "@/components/panel/estado-editable"
import { conAviso } from "@/lib/avisos"
import type { ParaConfirmar } from "@/lib/panel/confirmaciones"
import type { Plantilla } from "@/lib/panel/plantillas"
import { cn } from "cn"

const respuestas = {
  CONFIRMO: { nombre: "Confirmó", clase: "bg-[#2e7d32] text-white" },
  CANCELO: { nombre: "No viene", clase: "bg-[#c62828] text-white" },
  sin: { nombre: "Sin respuesta", clase: "bg-[#f6d03c] text-[#3d2f00]" },
}

type Opcion = { id: string; nombre: string; icono: LucideIcon; clase?: string; hacer: () => void }

/// La confirmación de cada reserva en un solo botón: muestra qué respondió y despliega
/// escribirle por WhatsApp y anotar la respuesta.
export function AccionesDeConfirmacion({
  reserva,
  destinatario,
  plantillas,
}: {
  reserva: Pick<ParaConfirmar, "id" | "confirmacion" | "titular" | "codigo">
  destinatario: Destinatario
  plantillas: Plantilla[]
}) {
  const [posicion, setPosicion] = useState<CSSProperties | null>(null)
  const [whatsapp, setWhatsapp] = useState(false)
  const [pendiente, iniciar] = useTransition()
  const contenedor = useRef<HTMLDivElement>(null)
  const abierto = posicion !== null

  // Cierra el menú al tocar afuera, con Escape o al desplazar la página.
  useEffect(() => {
    if (!abierto) return
    const cerrar = () => setPosicion(null)
    const fuera = (evento: PointerEvent) => !contenedor.current?.contains(evento.target as Node) && cerrar()
    const escape = (evento: KeyboardEvent) => evento.key === "Escape" && cerrar()
    document.addEventListener("pointerdown", fuera)
    document.addEventListener("keydown", escape)
    window.addEventListener("scroll", cerrar, true)
    window.addEventListener("resize", cerrar)
    return () => {
      document.removeEventListener("pointerdown", fuera)
      document.removeEventListener("keydown", escape)
      window.removeEventListener("scroll", cerrar, true)
      window.removeEventListener("resize", cerrar)
    }
  }, [abierto])

  const responder = (respuesta: "CONFIRMO" | "CANCELO" | "SIN_RESPUESTA", exito: string) => {
    setPosicion(null)
    iniciar(async () => void (await conAviso(() => responderConfirmacion(reserva.id, respuesta), exito)))
  }

  const opciones: Opcion[] = [
    ...(destinatario.whatsapp
      ? [{ id: "whatsapp", nombre: "Escribir por WhatsApp", icono: MessageCircle, clase: "text-[#128c4a]", hacer: () => (setPosicion(null), setWhatsapp(true)) }]
      : []),
    ...(reserva.confirmacion === null
      ? [
          { id: "confirmo", nombre: "Confirmó", icono: Check, clase: "text-[#2e7d32]", hacer: () => responder("CONFIRMO", `Listo: ${reserva.titular} confirmó que viene.`) },
          {
            id: "cancelo",
            nombre: "No viene (se cancela)",
            icono: X,
            clase: "text-[#c62828]",
            hacer: () => {
              if (window.confirm(`¿${reserva.titular} avisó que no viene? La reserva se cancela y se liberan los lugares.`)) responder("CANCELO", "Listo: la reserva quedó cancelada.")
              else setPosicion(null)
            },
          },
        ]
      : reserva.confirmacion === "CONFIRMO"
        ? [{ id: "deshacer", nombre: "Volver a sin respuesta", icono: RotateCcw, hacer: () => responder("SIN_RESPUESTA", "Listo: volvió a sin respuesta.") }]
        : []),
  ]
  const respuesta = respuestas[reserva.confirmacion ?? "sin"]

  return (
    <div ref={contenedor} className="inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Confirmación de ${reserva.codigo}: ${respuesta.nombre}${destinatario.whatsapp ? "" : ", sin celular válido"}. Acciones`}
        disabled={pendiente || !opciones.length}
        onClick={(evento) => setPosicion(abierto ? null : posicionDelMenu(evento.currentTarget))}
        className={cn("inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-bold whitespace-nowrap ring-offset-2 hover:ring-2 hover:ring-panel-ink/20 disabled:opacity-70", respuesta.clase)}
      >
        {pendiente ? "Guardando…" : respuesta.nombre}
        {opciones.length ? <ChevronDown className="size-4" aria-hidden /> : null}
      </button>
      {!destinatario.whatsapp ? <span className="mt-1 block text-xs text-panel-muted">Sin celular válido</span> : null}
      {abierto ? (
        <ul role="menu" aria-label={`Acciones de ${reserva.codigo}`} style={posicion ?? undefined} className="fixed z-50 min-w-56 overflow-hidden rounded-2xl border border-panel-line bg-white py-1 shadow-[0_16px_40px_rgba(58,42,24,0.18)]">
          {opciones.map(({ id, nombre, icono: Icono, clase, hacer }) => (
            <li key={id} role="none">
              <button type="button" role="menuitem" onClick={hacer} className={cn("flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-panel", clase)}>
                <Icono className="size-4" aria-hidden />
                {nombre}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {whatsapp ? <DialogoDeWhatsapp destinatario={destinatario} plantillas={plantillas} tipo="confirmacion" onCerrar={() => setWhatsapp(false)} /> : null}
    </div>
  )
}
