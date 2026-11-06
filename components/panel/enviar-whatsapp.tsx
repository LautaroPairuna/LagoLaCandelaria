"use client"

import { MessageCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { anotarWhatsapp } from "@/app/panel/clientes/acciones"
import { llamar } from "@/lib/avisos"
import { armarMensaje, enlaceDeWhatsapp, tiposDePlantilla, type DatosDelMensaje, type Plantilla, type TipoDePlantilla } from "@/lib/panel/plantillas"
import { cn } from "cn"

export type Destinatario = {
  clienteId?: number
  reservaId?: number
  titular: string
  /// El número para wa.me, o null si no tiene un celular válido.
  whatsapp: string | null
  datos: DatosDelMensaje
}

/// El botón de WhatsApp del panel: se elige uno de los mensajes guardados, se puede retocar
/// para este cliente y se abre el chat. Queda anotado (el tilde de contacto en Puerta).
export function EnviarWhatsapp({
  destinatario,
  plantillas,
  tipo,
  etiqueta = "WhatsApp",
  className,
}: {
  destinatario: Destinatario
  plantillas: Plantilla[]
  tipo: TipoDePlantilla
  etiqueta?: string
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  if (!destinatario.whatsapp) return <span className="text-sm text-panel-muted">Sin celular válido</span>
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25d366] px-3 text-sm font-bold whitespace-nowrap text-[#05351c] hover:bg-[#1fbe5b]", className)}
      >
        <MessageCircle className="size-4" aria-hidden />
        {etiqueta}
      </button>
      {abierto ? <Dialogo destinatario={destinatario} plantillas={plantillas} tipo={tipo} onCerrar={() => setAbierto(false)} /> : null}
    </>
  )
}

function Dialogo({ destinatario, plantillas, tipo, onCerrar }: { destinatario: Destinatario; plantillas: Plantilla[]; tipo: TipoDePlantilla; onCerrar: () => void }) {
  const router = useRouter()
  const dialogo = useRef<HTMLDialogElement>(null)
  const inicial = plantillas.find((plantilla) => plantilla.tipo === tipo) ?? plantillas[0]
  const [elegida, setElegida] = useState(inicial?.id ?? 0)
  const [texto, setTexto] = useState(inicial ? armarMensaje(inicial.texto, destinatario.datos) : "")
  const plantilla = plantillas.find((item) => item.id === elegida)

  // Se abre como modal al montarse: el foco queda adentro y Escape lo cierra.
  useEffect(() => {
    dialogo.current?.showModal()
  }, [])

  function elegir(id: number) {
    const nueva = plantillas.find((item) => item.id === id)
    setElegida(id)
    if (nueva) setTexto(armarMensaje(nueva.texto, destinatario.datos))
  }

  function abrir() {
    window.open(enlaceDeWhatsapp(destinatario.whatsapp!, texto), "_blank", "noopener")
    const tipoEnviado = (plantilla?.tipo ?? "libre") as TipoDePlantilla
    void llamar(() => anotarWhatsapp({ clienteId: destinatario.clienteId, reservaId: destinatario.reservaId, tipo: tipoEnviado, plantilla: plantilla?.nombre })).then(() => router.refresh())
    dialogo.current?.close()
  }

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-labelledby="whatsapp-titulo"
      className="m-auto max-h-[90svh] w-[min(34rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-left text-panel-ink backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-3 border-b border-panel-line px-5 py-4">
        <div className="min-w-0">
          <h2 id="whatsapp-titulo" className="font-display text-2xl tracking-tight">
            WhatsApp a {destinatario.titular}
          </h2>
          <p className="text-sm text-panel-muted">Elegí un mensaje guardado y retocalo si hace falta: los cambios son solo para este envío.</p>
        </div>
        <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <form
        className="space-y-3 px-5 py-4"
        onSubmit={(evento) => {
          evento.preventDefault()
          abrir()
        }}
      >
        <label className="block text-sm font-semibold">
          Mensaje
          <select value={elegida} onChange={(evento) => elegir(Number(evento.target.value))} className="mt-1 block h-11 w-full rounded-xl border border-panel-line bg-white px-3 text-base">
            {tiposDePlantilla.map((grupo) => {
              const delGrupo = plantillas.filter((item) => item.tipo === grupo.id)
              return delGrupo.length ? (
                <optgroup key={grupo.id} label={grupo.nombre}>
                  {delGrupo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </optgroup>
              ) : null
            })}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Texto
          <textarea value={texto} onChange={(evento) => setTexto(evento.target.value)} rows={8} className="mt-1 block w-full rounded-xl border border-panel-line bg-white px-3 py-2 text-base font-normal" />
        </label>
        <button type="submit" disabled={!texto.trim()} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] font-bold text-[#05351c] hover:bg-[#1fbe5b] disabled:opacity-50">
          <MessageCircle className="size-5" aria-hidden />
          Abrir WhatsApp
        </button>
      </form>
    </dialog>
  )
}
