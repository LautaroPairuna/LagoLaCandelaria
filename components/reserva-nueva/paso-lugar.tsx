"use client"

import { Check, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { avisarError, falloDeRed } from "@/lib/avisos"
import type { LugarDisponible } from "@/lib/disponibilidad"
import { revisarEleccion, sugerir, type TipoDeLugar } from "@/lib/predio/eleccion"
import { gruposDeParrillas, MAX_PERSONAS_PARRILLA, type UnidadPredio } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { cn } from "cn"

type Seccion = { titulo: string; detalle: string; lugares: LugarDisponible[] }

function secciones(tipo: TipoDeLugar, personas: number, lugares: LugarDisponible[]): Seccion[] {
  const delTipo = (...tipos: UnidadPredio["tipo"][]) => lugares.filter((lugar) => tipos.includes(lugar.tipo))
  if (tipo === "parrilla") {
    if (personas > MAX_PERSONAS_PARRILLA) {
      return [{ titulo: "Quinchos", detalle: `Para grupos de más de ${MAX_PERSONAS_PARRILLA} personas`, lugares: delTipo("QUINCHO") }]
    }
    return gruposDeParrillas.map((grupo) => ({
      titulo: `Parrillas para ${grupo.capacidad} personas`,
      detalle: `${grupo.mesas} ${grupo.mesas === 1 ? "mesa" : "mesas"}`,
      lugares: delTipo("PARRILLA").filter((lugar) => (grupo.numeros as readonly number[]).includes(lugar.numero)),
    }))
  }
  if (tipo === "playa") {
    return [
      { titulo: "Gazebos", detalle: "Hasta 8 personas cada uno", lugares: delTipo("GAZEBO") },
      { titulo: "Palapas", detalle: "Hasta 6 personas cada una", lugares: delTipo("PALAPA") },
    ]
  }
  return [{ titulo: "Bungalows", detalle: "Hasta 4 personas cada uno", lugares: delTipo("BUNGALOW") }]
}

const nombre = (lugar: Pick<LugarDisponible, "tipo" | "etiqueta">) => `${nombreDeUnidad[lugar.tipo]} ${lugar.etiqueta}`

export function PasoLugar({
  tipo,
  desde,
  hasta,
  personas,
  elegidas,
  onChange,
}: {
  tipo: TipoDeLugar
  desde: string
  hasta: string
  personas: number
  elegidas: string[]
  onChange: (ids: string[]) => void
}) {
  const [lugares, setLugares] = useState<LugarDisponible[] | null>(null)
  const [fallo, setFallo] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    const categoria = tipo === "parrilla" ? "parrilla" : tipo
    fetch(`/api/lugares?tipo=${categoria}&desde=${desde}&hasta=${hasta}`, { signal: controlador.signal })
      .then((respuesta) => respuesta.json())
      .then((json: { ok: boolean; error?: string; lugares?: LugarDisponible[] }) => {
        if (!json.ok || !json.lugares) throw new Error(json.error)
        setFallo(false)
        setLugares(json.lugares)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFallo(true)
        avisarError(error instanceof Error && error.message ? error.message : falloDeRed().error, { id: "lugares", reintentar: () => setIntento((actual) => actual + 1) })
      })
    return () => controlador.abort()
  }, [tipo, desde, hasta, intento])

  // Si alguno de los elegidos dejó de estar libre (otra reserva lo tomó), se suelta.
  useEffect(() => {
    if (!lugares) return
    const libres = new Set(lugares.filter((lugar) => lugar.estado === "libre").map((lugar) => lugar.id))
    if (elegidas.some((id) => !libres.has(id))) onChange(elegidas.filter((id) => libres.has(id)))
  }, [lugares, elegidas, onChange])

  if (!lugares) {
    return fallo ? (
      <p className="text-sm text-ink/70">
        No se cargaron los lugares.{" "}
        <button type="button" className="font-semibold text-lake-ink underline underline-offset-4" onClick={() => setIntento((actual) => actual + 1)}>
          Volver a intentar
        </button>
      </p>
    ) : (
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-busy>
        {Array.from({ length: 16 }, (_, indice) => (
          <span key={indice} className="h-16 animate-pulse rounded-xl bg-ink/5" />
        ))}
      </div>
    )
  }

  const unidades = elegidas.map((id) => lugares.find((lugar) => lugar.id === id)).filter((lugar) => lugar !== undefined) as UnidadPredio[]
  const revision = revisarEleccion(tipo, personas, unidades)
  const libres = lugares.filter((lugar) => lugar.estado === "libre") as UnidadPredio[]
  const sugerencia = sugerir(tipo, personas, libres)

  function alternar(id: string) {
    onChange(elegidas.includes(id) ? elegidas.filter((item) => item !== id) : [...elegidas, id])
  }

  return (
    <div className="space-y-5">
      <div
        role="status"
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 text-sm",
          revision.ok ? "bg-green-soft text-lime-ink" : "bg-sand text-ink",
        )}
      >
        <span className="flex min-w-0 flex-1 items-start gap-2 font-semibold">
          {revision.ok ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
          {revision.ok ? `Listo: ${unidades.map(nombre).join(", ")} para ${personas} ${personas === 1 ? "persona" : "personas"}.` : revision.mensaje}
        </span>
        {!revision.ok && sugerencia ? (
          <button
            type="button"
            onClick={() => onChange(sugerencia.map((unidad) => unidad.id))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 font-semibold hover:border-ink/40"
          >
            <Sparkles className="size-4 text-orange" aria-hidden />
            Elegir por mí
          </button>
        ) : null}
      </div>

      {!sugerencia && !revision.ok ? (
        <p className="rounded-2xl bg-[#fde8e4] px-4 py-3 text-sm text-[#7a2e24]">
          Para esa fecha no quedan lugares suficientes para tu grupo. Volvé al paso de la fecha y probá con otra, o escribinos por WhatsApp.
        </p>
      ) : null}

      {secciones(tipo, personas, lugares).map((seccion) => (
        <section key={seccion.titulo} aria-label={seccion.titulo}>
          <h3 className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-semibold">{seccion.titulo}</span>
            <span className="text-sm text-ink/60">
              {seccion.detalle} · {seccion.lugares.filter((lugar) => lugar.estado === "libre").length} libres
            </span>
          </h3>
          <ul className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:gap-2">
            {seccion.lugares.map((lugar) => {
              const elegido = elegidas.includes(lugar.id)
              const libre = lugar.estado === "libre"
              return (
                <li key={lugar.id}>
                  <button
                    type="button"
                    disabled={!libre}
                    aria-pressed={elegido}
                    aria-label={`${nombre(lugar)}${lugar.capacidad ? `, hasta ${lugar.capacidad} personas` : ""}${libre ? (elegido ? ", elegido" : ", libre") : lugar.estado === "deja-huecos" ? ", no disponible para esas fechas" : ", ocupado"}`}
                    title={lugar.estado === "deja-huecos" ? "Con esas fechas dejaría una noche suelta" : undefined}
                    onClick={() => alternar(lugar.id)}
                    className={cn(
                      "flex h-14 w-full flex-col items-center justify-center rounded-xl border text-center transition md:h-16",
                      libre && !elegido && "border-[#9fd18f] bg-[#eaf6e4] text-[#2f5d16] hover:bg-[#d6eecb]",
                      elegido && "border-orange bg-orange text-sobre-naranja",
                      !libre && "cursor-not-allowed border-transparent bg-ink/5 text-ink/30 line-through",
                    )}
                  >
                    <span className="text-base leading-none font-bold">{lugar.etiqueta}</span>
                    {lugar.capacidad && libre ? <span className="mt-1 text-[0.65rem] leading-none">{lugar.capacidad} pers.</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <ul aria-label="Referencias" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold text-ink/60">
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded border border-[#9fd18f] bg-[#eaf6e4]" /> Libre
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded bg-orange" /> Elegido
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded bg-ink/5" /> Ocupado
        </li>
      </ul>
    </div>
  )
}
