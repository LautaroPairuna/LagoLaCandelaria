"use client"

import { Check, Minus, Plus, Search } from "lucide-react"
import { useState, useTransition } from "react"

import { contarEnGrupo, marcarActividad } from "@/app/panel/actividades/acciones"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import { conAviso } from "@/lib/avisos"
import type { ReservaConActividad } from "@/lib/panel/actividad-del-dia"
import { estilosDeEstado } from "@/lib/panel/estados"
import { cn } from "cn"

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/// La lista del profesor: busca la reserva y marca, persona por persona o por familia,
/// quién ya hizo la actividad. Cada persona la hace una sola vez por visita.
export function MarcarActividad({ actividad, nombre, reservas, puedeMarcar }: { actividad: string; nombre: string; reservas: ReservaConActividad[]; puedeMarcar: boolean }) {
  const [busqueda, setBusqueda] = useState("")
  const texto = normalizar(busqueda.trim().replace(/^(n\.?\s*º?|#)\s*/, ""))
  const visibles = texto
    ? reservas.filter(
        (reserva) =>
          String(reserva.id) === texto ||
          normalizar([reserva.titular, reserva.codigo, ...reserva.integrantes.map((persona) => `${persona.nombre} ${persona.apellido}`)].join(" ")).includes(texto),
      )
    : reservas

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-panel-muted" aria-hidden />
        <input
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscá por apellido, nombre o N.º de reserva"
          aria-label="Buscar reserva o persona"
          className="h-14 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-12 text-lg"
        />
      </div>
      {visibles.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-panel-muted">{busqueda ? "Nadie coincide con la búsqueda." : "No hay reservas para este día."}</p>
      ) : (
        <ul className="grid items-start gap-3 xl:grid-cols-2">
          {visibles.map((reserva) => (
            <TarjetaDeReserva key={reserva.id} reserva={reserva} actividad={actividad} nombre={nombre} puedeMarcar={puedeMarcar} />
          ))}
        </ul>
      )}
    </div>
  )
}

function TarjetaDeReserva({ reserva, actividad, nombre, puedeMarcar }: { reserva: ReservaConActividad; actividad: string; nombre: string; puedeMarcar: boolean }) {
  const [pendiente, iniciar] = useTransition()
  const estilo = estilosDeEstado[reserva.visible]
  const familias = [...new Set(reserva.integrantes.map((persona) => persona.familia))]
  const faltan = reserva.integrantes.filter((persona) => !reserva.hechas[persona.id])

  function marcar(personas: number[], hizo: boolean, exito: string) {
    iniciar(async () => void (await conAviso(() => marcarActividad({ reservaId: reserva.id, actividad, personas, hizo }), exito)))
  }

  return (
    <li className={cn("min-w-0 rounded-3xl border-2 border-l-8 p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5", estilo.tarjeta, estilo.borde)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">
            N.º {reserva.id} · {reserva.codigo}
            {reserva.lugares.length ? ` · ${reserva.lugares.join(", ")}` : ""}
          </p>
          <p className="font-display text-2xl tracking-tight">{reserva.titular}</p>
          <p className="text-base font-semibold">
            {reserva.hicieron} de {reserva.personas} ya {reserva.hicieron === 1 ? "hizo" : "hicieron"} {nombre.toLowerCase()}
          </p>
        </div>
        <InsigniaDeEstado estado={reserva.visible} />
      </div>

      {reserva.conLista ? (
        <div className="mt-3 space-y-3">
          {puedeMarcar && faltan.length > 1 ? (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => marcar(faltan.map((persona) => persona.id), true, `Listo, ${faltan.length} personas hicieron ${nombre.toLowerCase()}.`)}
              className="h-11 rounded-full bg-panel-ink px-5 font-semibold text-white hover:bg-panel-tostado disabled:opacity-60"
            >
              La hicieron {faltan.length === reserva.integrantes.length ? "todos" : `los ${faltan.length} que faltan`}
            </button>
          ) : null}
          {familias.map((familia) => {
            const deLaFamilia = reserva.integrantes.filter((persona) => persona.familia === familia)
            const faltanEnFamilia = deLaFamilia.filter((persona) => !reserva.hechas[persona.id])
            return (
              <div key={familia}>
                {familias.length > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">Familia {familia}</p>
                    {puedeMarcar && faltanEnFamilia.length > 1 ? (
                      <button
                        type="button"
                        disabled={pendiente}
                        onClick={() => marcar(faltanEnFamilia.map((persona) => persona.id), true, `Listo, la familia ${familia} hizo ${nombre.toLowerCase()}.`)}
                        className="h-9 rounded-full border border-panel-ink/30 bg-white px-3.5 text-sm font-bold hover:border-panel-ink"
                      >
                        La hizo la familia {familia}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <ul className="mt-1 divide-y divide-black/5 rounded-2xl bg-white/85 px-3">
                  {deLaFamilia.map((persona) => {
                    const hecha = reserva.hechas[persona.id]
                    return (
                      <li key={persona.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {persona.nombre} {persona.apellido}
                          </span>
                          <span className="block text-sm text-panel-muted">
                            {persona.edad} años
                            {persona.estado === "pendiente" ? " · todavía no ingresó" : ""}
                            {hecha ? ` · la hizo a las ${hecha.hora}${hecha.por ? ` (${hecha.por})` : ""}` : ""}
                          </span>
                          {persona.notas ? <span className="block text-sm font-semibold text-panel-tostado">{persona.notas}</span> : null}
                        </span>
                        {hecha ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2e7d32] px-3 py-1.5 text-sm font-bold text-white">
                              <Check className="size-4" aria-hidden />
                              Ya la hizo
                            </span>
                            {puedeMarcar ? (
                              <button
                                type="button"
                                disabled={pendiente}
                                onClick={() => marcar([persona.id], false, `Listo, se desmarcó a ${persona.nombre}.`)}
                                className="text-sm text-panel-muted underline-offset-4 hover:underline"
                              >
                                Deshacer
                              </button>
                            ) : null}
                          </span>
                        ) : puedeMarcar ? (
                          <button
                            type="button"
                            disabled={pendiente}
                            onClick={() => marcar([persona.id], true, `Listo, ${persona.nombre} hizo ${nombre.toLowerCase()}.`)}
                            className="h-11 rounded-full border-2 border-panel-ink bg-white px-4 text-sm font-bold hover:bg-panel-ink hover:text-white disabled:opacity-60"
                          >
                            Marcar que la hizo
                          </button>
                        ) : (
                          <span className="text-sm text-panel-muted">Pendiente</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <ContadorDeGrupo reserva={reserva} actividad={actividad} nombre={nombre} puedeMarcar={puedeMarcar} />
      )}
    </li>
  )
}

/// Los grupos estudiantiles no tienen la lista de alumnos: se cuenta cuántos la hicieron.
function ContadorDeGrupo({ reserva, actividad, nombre, puedeMarcar }: { reserva: ReservaConActividad; actividad: string; nombre: string; puedeMarcar: boolean }) {
  const [pendiente, iniciar] = useTransition()
  function guardar(cantidad: number) {
    iniciar(async () => void (await conAviso(() => contarEnGrupo({ reservaId: reserva.id, actividad, cantidad }), `Listo: ${cantidad} de ${reserva.personas} hicieron ${nombre.toLowerCase()}.`)))
  }
  return (
    <div className="mt-3 rounded-2xl bg-white/85 p-3">
      <p className="text-sm text-panel-muted">Este grupo no tiene la lista de personas: anotá cuántos la hicieron.</p>
      {puedeMarcar ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Uno menos"
            disabled={pendiente || reserva.enGrupo === 0}
            onClick={() => guardar(reserva.enGrupo - 1)}
            className="grid size-11 place-items-center rounded-full border border-panel-line bg-white disabled:opacity-40"
          >
            <Minus className="size-5" aria-hidden />
          </button>
          <span className="font-display w-14 text-center text-3xl tabular-nums">{reserva.enGrupo}</span>
          <button
            type="button"
            aria-label="Uno más"
            disabled={pendiente || reserva.enGrupo >= reserva.personas}
            onClick={() => guardar(reserva.enGrupo + 1)}
            className="grid size-11 place-items-center rounded-full border border-panel-line bg-white disabled:opacity-40"
          >
            <Plus className="size-5" aria-hidden />
          </button>
          {reserva.enGrupo < reserva.personas ? (
            <button type="button" disabled={pendiente} onClick={() => guardar(reserva.personas)} className="h-11 rounded-full bg-panel-ink px-5 font-semibold text-white hover:bg-panel-tostado">
              La hicieron todos ({reserva.personas})
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
