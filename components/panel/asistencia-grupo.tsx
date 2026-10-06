"use client"

import { useTransition, type ReactNode } from "react"

import { registrarAsistencia } from "@/app/panel/puerta/acciones"
import { Button } from "@/components/ui/button"
import { conAviso } from "@/lib/avisos"
import { nombreDeEstado, type EstadoPersona, type Movimiento } from "@/lib/panel/asistencia"
import { cn } from "cn"

export type Integrante = {
  id: number
  familia: number
  responsable: boolean
  nombre: string
  apellido: string
  dni: string | null
  edad: number
  notas: string | null
  estado: EstadoPersona
}

const colorDeEstado: Record<EstadoPersona, string> = {
  pendiente: "bg-panel text-panel-muted",
  adentro: "bg-[#e8f4e3] text-[#3f6b12]",
  salio: "bg-panel-line text-panel-ink",
}

function lasQue(cantidad: number, resto: string) {
  return cantidad === 1 ? `la persona que ${resto.replace("faltan", "falta").replace("están", "está")}` : `las ${cantidad} personas que ${resto}`
}

/// Ingreso y salida persona por persona, agrupadas por familia. Con `completo` muestra
/// también DNI y anotaciones (vista de la reserva); sin él, la versión corta de Puerta.
export function AsistenciaDelGrupo({
  reservaId,
  integrantes,
  puedeMarcar,
  completo = false,
  plegado = false,
}: {
  reservaId: number
  integrantes: Integrante[]
  puedeMarcar: boolean
  completo?: boolean
  plegado?: boolean
}) {
  const [pendiente, iniciar] = useTransition()
  const familias = [...new Set(integrantes.map((persona) => persona.familia))]
  const pendientes = integrantes.filter((persona) => persona.estado === "pendiente").length
  const adentro = integrantes.filter((persona) => persona.estado === "adentro").length

  function mover(movimiento: Movimiento, ids?: number[], exito?: string) {
    iniciar(async () => {
      await conAviso(
        () => registrarAsistencia({ reservaId, movimiento, personas: ids }),
        (resultado) =>
          exito ??
          (movimiento === "ingreso"
            ? `Listo, ${resultado.personas === 1 ? "ingresó 1 persona" : `ingresaron ${resultado.personas} personas`}.`
            : movimiento === "salida"
              ? `Listo, ${resultado.personas === 1 ? "se fue 1 persona" : `se fueron ${resultado.personas} personas`}.`
              : "Listo, se deshizo el último paso."),
      )
    })
  }

  return (
    <div className="space-y-4">
      {puedeMarcar && (pendientes > 0 || adentro > 0) ? (
        <div className="flex flex-wrap gap-2">
          {pendientes > 0 ? (
            <Button type="button" disabled={pendiente} className="h-10 bg-panel-ink px-4 text-white hover:bg-panel-tostado" onClick={() => mover("ingreso")}>
              {pendientes === integrantes.length ? "Ingresaron todos" : `${pendientes === 1 ? "Ingresó" : "Ingresaron"} ${lasQue(pendientes, "faltan")}`}
            </Button>
          ) : null}
          {adentro > 0 ? (
            <Button type="button" variant="outline" disabled={pendiente} className="h-10 px-4" onClick={() => mover("salida")}>
              {adentro === integrantes.length ? "Se fueron todos" : `${adentro === 1 ? "Se fue" : "Se fueron"} ${lasQue(adentro, "están adentro")}`}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Plegable plegado={plegado} cantidad={integrantes.length} reservaId={reservaId}>
      {familias.map((familia) => (
        <div key={familia}>
          {familias.length > 1 ? <h3 className="text-xs font-bold tracking-wide text-panel-muted uppercase">Familia {familia}</h3> : null}
          <ul className="divide-y divide-panel-line">
            {integrantes
              .filter((persona) => persona.familia === familia)
              .map((persona) => (
                <li key={persona.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">
                      {persona.nombre} {persona.apellido}
                    </span>
                    {persona.responsable ? <span className="ml-2 text-xs font-bold text-panel-naranja">Responsable</span> : null}
                    <span className="block text-panel-muted">
                      {persona.edad} años · {persona.edad >= 13 ? "Adulto" : "Menor"}
                      {completo && persona.dni ? ` · DNI ${persona.dni}` : ""}
                    </span>
                    {persona.notas ? <span className={cn("block font-semibold text-panel-tostado", !completo && "text-xs")}>{persona.notas}</span> : null}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", colorDeEstado[persona.estado])}>{nombreDeEstado[persona.estado]}</span>
                  {puedeMarcar ? (
                    <span className="flex items-center gap-2">
                      {persona.estado === "pendiente" ? (
                        <button
                          type="button"
                          disabled={pendiente}
                          className="h-9 rounded-full bg-panel-ink px-3.5 text-xs font-bold text-white hover:bg-panel-tostado"
                          onClick={() => mover("ingreso", [persona.id], `Listo, ${persona.nombre} ingresó.`)}
                        >
                          Marcar ingreso
                        </button>
                      ) : null}
                      {persona.estado === "adentro" ? (
                        <button
                          type="button"
                          disabled={pendiente}
                          className="h-9 rounded-full border border-panel-line bg-white px-3.5 text-xs font-bold hover:border-panel-muted"
                          onClick={() => mover("salida", [persona.id], `Listo, ${persona.nombre} se fue.`)}
                        >
                          Marcar salida
                        </button>
                      ) : null}
                      {persona.estado !== "pendiente" ? (
                        <button
                          type="button"
                          disabled={pendiente}
                          className="text-xs text-panel-muted underline-offset-4 hover:underline"
                          onClick={() => mover("deshacer", [persona.id], `Listo, ${persona.nombre} vuelve a ${persona.estado === "salio" ? "figurar adentro" : "pendiente de ingreso"}.`)}
                        >
                          Deshacer
                        </button>
                      ) : null}
                    </span>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ))}
      </Plegable>
    </div>
  )
}

// Al marcar a alguien la tarjeta cambia de lista y se vuelve a montar: se recuerda
// qué listas estaban abiertas para no tener que desplegarlas de nuevo.
const abiertas = new Set<number>()

function Plegable({ plegado, cantidad, reservaId, children }: { plegado: boolean; cantidad: number; reservaId: number; children: ReactNode }) {
  if (!plegado) return <>{children}</>
  return (
    <details
      className="group"
      open={abiertas.has(reservaId)}
      onToggle={(evento) => {
        if (evento.currentTarget.open) abiertas.add(reservaId)
        else abiertas.delete(reservaId)
      }}
    >
      <summary className="cursor-pointer text-sm font-semibold text-panel-tostado">Ver las {cantidad} personas</summary>
      <div className="mt-2 space-y-4">{children}</div>
    </details>
  )
}
