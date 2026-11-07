"use client"

import { Plus, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

import { borrarPlantilla, guardarPlantilla } from "@/app/panel/clientes/acciones"
import { conAviso } from "@/lib/avisos"
import { armarMensaje, marcas, tiposDePlantilla, type DatosDelMensaje, type Plantilla, type TipoDePlantilla } from "@/lib/panel/plantillas"
import { cn } from "cn"
import { confirmar } from "@/components/panel/confirmador"

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const campo = "mt-1 block w-full rounded-xl border border-panel-line bg-white px-3 text-base font-normal"

const ejemplo: DatosDelMensaje = {
  nombre: "Laura",
  codigo: "LC-7Q2M4K",
  fecha: "sábado 14 de noviembre de 2026",
  ticket: "https://lagolacandelaria.com/reserva/t/…",
  reglamento: "📌 *En este link también vas a encontrar los horarios y el reglamento del predio.*",
}

/// Los mensajes guardados, por tipo. Cada uno se edita en el lugar y muestra cómo le
/// llega a un cliente de ejemplo.
export function EditorDePlantillas({ plantillas }: { plantillas: Plantilla[] }) {
  return (
    <div className="space-y-6">
      <section className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)} aria-label="Marcas">
        <h2 className="font-display text-xl tracking-tight">Marcas que se reemplazan</h2>
        <p className="mt-1 text-sm text-panel-muted">Escribilas tal cual, con las llaves, y al enviar se cambian por los datos de cada reserva.</p>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {marcas.map((item) => (
            <div key={item.marca} className="flex gap-2">
              <dt className="font-mono font-bold">{item.marca}</dt>
              <dd className="text-panel-muted">{item.explicacion}</dd>
            </div>
          ))}
        </dl>
      </section>
      {tiposDePlantilla.map((tipo) => (
        <section key={tipo.id} aria-labelledby={`tipo-${tipo.id}`}>
          <h2 id={`tipo-${tipo.id}`} className="font-display text-2xl tracking-tight">
            {tipo.nombre}
          </h2>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            {plantillas
              .filter((plantilla) => plantilla.tipo === tipo.id)
              .map((plantilla) => (
                <Formulario key={plantilla.id} plantilla={plantilla} tipo={tipo.id} />
              ))}
            <Nuevo tipo={tipo.id} />
          </div>
        </section>
      ))}
    </div>
  )
}

function Nuevo({ tipo }: { tipo: TipoDePlantilla }) {
  const [abierto, setAbierto] = useState(false)
  if (abierto) return <Formulario tipo={tipo} onListo={() => setAbierto(false)} />
  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="flex min-h-24 items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-panel-line text-sm font-semibold text-panel-muted hover:border-panel-muted hover:text-panel-ink"
    >
      <Plus className="size-4" aria-hidden />
      Nuevo mensaje
    </button>
  )
}

function Formulario({ plantilla, tipo, onListo }: { plantilla?: Plantilla; tipo: TipoDePlantilla; onListo?: () => void }) {
  const [pendiente, iniciar] = useTransition()
  const [nombre, setNombre] = useState(plantilla?.nombre ?? "")
  const [texto, setTexto] = useState(plantilla?.texto ?? "")
  const cambiado = !plantilla || nombre !== plantilla.nombre || texto !== plantilla.texto

  return (
    <form
      className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}
      onSubmit={(evento) => {
        evento.preventDefault()
        iniciar(async () => {
          const resultado = await conAviso(() => guardarPlantilla({ id: plantilla?.id, tipo, nombre, texto }), `Listo, se guardó «${nombre.trim()}».`)
          if (resultado.ok) onListo?.()
        })
      }}
    >
      <label className="block text-sm font-semibold">
        Nombre
        <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} maxLength={60} placeholder="Para reconocerlo al enviar" className={cn(campo, "h-11")} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Texto
        <textarea value={texto} onChange={(evento) => setTexto(evento.target.value)} rows={6} maxLength={2000} className={cn(campo, "py-2")} />
      </label>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-panel-tostado">Cómo le llega a un cliente</summary>
        <p className="mt-2 rounded-2xl bg-[#e7fbe9] px-3 py-2 whitespace-pre-wrap">{armarMensaje(texto, ejemplo) || "—"}</p>
      </details>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pendiente || !cambiado} className="h-10 rounded-full bg-panel-ink px-5 text-sm font-bold text-white hover:bg-panel-tostado disabled:opacity-50">
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
        {plantilla ? (
          <button
            type="button"
            disabled={pendiente}
            onClick={async () => {
              if (!(await confirmar(`¿Borrar el mensaje «${plantilla.nombre}»?`, { aceptar: "Borrar", peligro: true }))) return
              iniciar(async () => void (await conAviso(() => borrarPlantilla(plantilla.id), "Listo, se borró el mensaje.")))
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#a32020] hover:bg-[#fde9e7]"
          >
            <Trash2 className="size-4" aria-hidden />
            Borrar
          </button>
        ) : (
          <button type="button" onClick={onListo} className="h-10 rounded-full px-3 text-sm font-semibold text-panel-muted hover:bg-panel">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
