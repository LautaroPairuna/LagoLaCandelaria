"use client"

import { Check, CheckCheck, MessageCircle, SkipForward, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { confirmarVarias, marcarTicketEnviado } from "@/app/panel/reservas/acciones"
import { conAviso, llamar } from "@/lib/avisos"
import { cn } from "cn"
import { confirmar } from "@/components/panel/confirmador"

export type EnvioDeTicket = { id: number; titular: string; telefono: string; whatsapp: string | null; enviado: boolean }

/// Confirmar todas las «a confirmar» de la lista y mandar los tickets por WhatsApp.
/// WhatsApp no deja enviar mensajes solos desde una página: el envío abre cada chat con el
/// mensaje escrito y pasa al siguiente; quien lo usa toca «enviar» en WhatsApp.
export function AccionesMasivas({ aConfirmar, envios, puedeConfirmar }: { aConfirmar: number[]; envios: EnvioDeTicket[]; puedeConfirmar: boolean }) {
  const [pendiente, iniciar] = useTransition()
  const [enviando, setEnviando] = useState(false)
  const conCelular = envios.filter((envio) => envio.whatsapp)

  if (!aConfirmar.length && !conCelular.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {puedeConfirmar && aConfirmar.length ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={async () => {
            if (!(await confirmar(`¿Confirmar ${aConfirmar.length === 1 ? "la reserva" : `las ${aConfirmar.length} reservas`} a confirmar de esta lista?`, { aceptar: "Confirmar todas" }))) return
            iniciar(async () => void (await conAviso(() => confirmarVarias(aConfirmar), (resultado) => `Listo, se ${resultado.confirmadas === 1 ? "confirmó 1 reserva" : `confirmaron ${resultado.confirmadas} reservas`}.`)))
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2e7d32] px-5 text-sm font-bold text-white hover:bg-[#1b5e20] disabled:opacity-60"
        >
          <CheckCheck className="size-4" aria-hidden />
          {pendiente ? "Confirmando…" : `Confirmar todas (${aConfirmar.length})`}
        </button>
      ) : null}
      {conCelular.length ? (
        <button type="button" onClick={() => setEnviando(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-bold text-[#05351c] hover:bg-[#1fbe5b]">
          <MessageCircle className="size-4" aria-hidden />
          Enviar los QR por WhatsApp ({conCelular.filter((envio) => !envio.enviado).length} sin enviar)
        </button>
      ) : null}
      {enviando ? <EnvioGuiado envios={envios} onCerrar={() => setEnviando(false)} /> : null}
    </div>
  )
}

function EnvioGuiado({ envios, onCerrar }: { envios: EnvioDeTicket[]; onCerrar: () => void }) {
  const router = useRouter()
  const dialogo = useRef<HTMLDialogElement>(null)
  const [enviados, setEnviados] = useState(() => new Set(envios.filter((envio) => envio.enviado).map((envio) => envio.id)))
  const [salteados, setSalteados] = useState(() => new Set<number>())
  const actual = envios.find((envio) => envio.whatsapp && !enviados.has(envio.id) && !salteados.has(envio.id))
  const conCelular = envios.filter((envio) => envio.whatsapp)

  // Se abre como modal al montarse: el foco queda adentro y Escape lo cierra.
  useEffect(() => {
    dialogo.current?.showModal()
  }, [])

  function abrir(envio: EnvioDeTicket) {
    setEnviados((anteriores) => new Set(anteriores).add(envio.id))
    void llamar(() => marcarTicketEnviado(envio.id))
  }

  return (
    <dialog
      ref={dialogo}
      onClose={() => {
        router.refresh()
        onCerrar()
      }}
      aria-labelledby="envio-titulo"
      className="m-auto max-h-[88svh] w-[min(36rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-3 border-b border-panel-line px-5 py-4">
        <div>
          <h2 id="envio-titulo" className="font-display text-2xl tracking-tight">
            Enviar los QR por WhatsApp
          </h2>
          <p className="mt-1 text-sm text-panel-muted">
            {enviados.size} de {conCelular.length} enviados. Se abre el chat con el mensaje listo: tocá «enviar» en WhatsApp y volvé acá para el siguiente.
          </p>
        </div>
        <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="px-5 py-4">
        {actual ? (
          <div className="rounded-2xl border-2 border-[#25d366] p-4">
            <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">Siguiente</p>
            <p className="font-display mt-1 text-2xl tracking-tight">{actual.titular}</p>
            <p className="text-sm text-panel-muted tabular-nums">{actual.telefono}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={actual.whatsapp ?? undefined}
                target="_blank"
                rel="noreferrer"
                onClick={() => abrir(actual)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 font-bold text-[#05351c] hover:bg-[#1fbe5b]"
              >
                <MessageCircle className="size-5" aria-hidden />
                Abrir WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setSalteados((anteriores) => new Set(anteriores).add(actual.id))}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-panel-line px-5 text-sm font-semibold hover:border-panel-muted"
              >
                <SkipForward className="size-4" aria-hidden />
                Saltear
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-[#e6f5e4] px-4 py-3 font-semibold text-[#24622a]">
            {salteados.size ? "No queda ninguno por enviar, salvo los que salteaste." : "Listo: se abrieron todos los chats."}
          </p>
        )}

        <ul className="mt-4 divide-y divide-panel-line text-sm">
          {envios.map((envio) => {
            const enviado = enviados.has(envio.id)
            return (
              <li key={envio.id} className={cn("flex items-center gap-3 py-2", envio.id === actual?.id && "font-semibold")}>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", enviado ? "bg-[#25d366] text-white" : "bg-panel")}>
                  {enviado ? <Check className="size-4" aria-hidden /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{envio.titular}</span>
                {!envio.whatsapp ? (
                  <span className="text-xs text-[#a32020]">Sin celular válido</span>
                ) : enviado ? (
                  <a href={envio.whatsapp} target="_blank" rel="noreferrer" className="text-xs font-semibold text-panel-tostado underline-offset-4 hover:underline">
                    Abrir de nuevo
                  </a>
                ) : salteados.has(envio.id) ? (
                  <button type="button" onClick={() => setSalteados((anteriores) => new Set([...anteriores].filter((id) => id !== envio.id)))} className="text-xs font-semibold text-panel-tostado">
                    Volver a la fila
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </dialog>
  )
}
