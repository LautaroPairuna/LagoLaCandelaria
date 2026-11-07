"use client"

import { useState, useTransition } from "react"

import { guardarPreciosDelPanel } from "@/app/panel/general/precios/acciones"
import { confirmar } from "@/components/panel/confirmador"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import { conRecargoTransferencia, pesos, preciosPorDefecto, tarifas, type Precios } from "@/lib/predio/tarifas"
import { cn } from "cn"

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const recargo = Math.round(tarifas.recargoTransferencia * 100)

type Campo = { clave: string; nombre: string; leer: (precios: Precios) => number; poner: (precios: Precios, valor: number) => Precios; conRecargo: boolean }

const grupos: { titulo: string; ayuda: string; campos: Campo[] }[] = [
  {
    titulo: "Entrada del día",
    ayuda: `Precio en efectivo. Por transferencia se suma el ${recargo} %.`,
    campos: [
      { clave: "finde-adulto", nombre: "Adulto · finde o feriado", leer: (p) => p.entrada.finde.adulto, poner: (p, v) => ({ ...p, entrada: { ...p.entrada, finde: { ...p.entrada.finde, adulto: v } } }), conRecargo: true },
      { clave: "finde-menor", nombre: "Menor (5 a 12) · finde o feriado", leer: (p) => p.entrada.finde.menor, poner: (p, v) => ({ ...p, entrada: { ...p.entrada, finde: { ...p.entrada.finde, menor: v } } }), conRecargo: true },
      { clave: "semana-adulto", nombre: "Adulto · día de semana", leer: (p) => p.entrada.semana.adulto, poner: (p, v) => ({ ...p, entrada: { ...p.entrada, semana: { ...p.entrada.semana, adulto: v } } }), conRecargo: true },
      { clave: "semana-menor", nombre: "Menor (5 a 12) · día de semana", leer: (p) => p.entrada.semana.menor, poner: (p, v) => ({ ...p, entrada: { ...p.entrada, semana: { ...p.entrada.semana, menor: v } } }), conRecargo: true },
    ],
  },
  {
    titulo: "Nado en aguas abiertas",
    ayuda: "Precio único por nadador: ya incluye el recargo.",
    campos: [
      { clave: "nado-finde", nombre: "Finde o feriado", leer: (p) => p.nado.finde, poner: (p, v) => ({ ...p, nado: { ...p.nado, finde: v } }), conRecargo: false },
      { clave: "nado-semana", nombre: "Día de semana", leer: (p) => p.nado.semana, poner: (p, v) => ({ ...p, nado: { ...p.nado, semana: v } }), conRecargo: false },
    ],
  },
  {
    titulo: "Bungalow",
    ayuda: "Por estadía de 2 días y 1 noche, con la entrada incluida. Se paga por adelantado.",
    campos: [{ clave: "bungalow", nombre: "Por bungalow", leer: (p) => p.bungalow, poner: (p, v) => ({ ...p, bungalow: v }), conRecargo: false }],
  },
]

/// Los precios editables, en pesos y sin puntos. Debajo de cada uno, cómo queda por
/// transferencia cuando corresponde.
export function FormularioDePrecios({ precios: guardados }: { precios: Precios }) {
  const [precios, setPrecios] = useState(guardados)
  const [pendiente, iniciar] = useTransition()
  const cambiado = JSON.stringify(precios) !== JSON.stringify(guardados)

  return (
    <form
      className="space-y-5"
      onSubmit={async (evento) => {
        evento.preventDefault()
        const vacios = grupos.flatMap((grupo) => grupo.campos).filter((campo) => !campo.leer(precios))
        if (vacios.length) return avisarRevisar(`Revisá ${vacios.map((campo) => campo.nombre.toLowerCase()).join(", ")}: falta el precio.`)
        if (!(await confirmar("¿Guardar los precios nuevos? Rigen desde ahora para la web y las reservas que se carguen.", { aceptar: "Guardar precios" }))) return
        iniciar(async () => void (await conAviso(() => guardarPreciosDelPanel(precios), "Listo, se guardaron los precios.")))
      }}
    >
      {grupos.map((grupo) => (
        <section key={grupo.titulo} className={cn("rounded-3xl bg-white p-4 md:p-5", sombra)}>
          <h3 className="font-display text-xl tracking-tight">{grupo.titulo}</h3>
          <p className="mt-1 text-sm text-panel-muted">{grupo.ayuda}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {grupo.campos.map((campo) => {
              const valor = campo.leer(precios)
              return (
                <label key={campo.clave} className="text-sm font-semibold text-panel-muted">
                  {campo.nombre}
                  <span className="mt-1 flex h-11 items-center rounded-xl border border-panel-line bg-white px-3 focus-within:ring-2 focus-within:ring-panel-ink/20">
                    <span className="text-panel-muted">$</span>
                    <input
                      inputMode="numeric"
                      value={valor ? valor.toLocaleString("es-AR") : ""}
                      onChange={(evento) => setPrecios(campo.poner(precios, Number(evento.target.value.replace(/\D/g, "")) || 0))}
                      className="ml-1 w-full min-w-0 bg-transparent text-base text-panel-ink outline-none tabular-nums"
                    />
                  </span>
                  <span className="mt-1 block text-xs font-normal">
                    {campo.conRecargo ? `Por transferencia: ${pesos(conRecargoTransferencia(valor))}` : null}
                    {campo.leer(preciosPorDefecto) !== valor ? <span className="block">Original: {pesos(campo.leer(preciosPorDefecto))}</span> : null}
                  </span>
                </label>
              )
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pendiente || !cambiado} className="h-12 rounded-full bg-panel-ink px-6 font-semibold text-white hover:bg-panel-tostado disabled:opacity-50">
          {pendiente ? "Guardando…" : "Guardar precios"}
        </button>
        {cambiado ? (
          <button type="button" onClick={() => setPrecios(guardados)} className="text-sm font-semibold text-panel-muted hover:underline">
            Deshacer los cambios
          </button>
        ) : null}
      </div>
    </form>
  )
}
