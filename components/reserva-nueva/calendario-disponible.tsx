"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import { avisarError, avisarRevisar, falloDeRed } from "@/lib/avisos"
import type { Categoria, EstadoDeFecha } from "@/lib/disponibilidad"
import { diaDeLaSemana, fechaLarga, fechasEntre, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { cn } from "cn"

export type DatosDelMes = { hoy: string; dias: Record<string, EstadoDeFecha>; bungalows?: Record<string, string[]> }

const nombresDeDia = ["L", "M", "M", "J", "V", "S", "D"]
const mesLargo = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })

function tituloDelMes(inicio: string) {
  const texto = mesLargo.format(new Date(`${inicio}T00:00:00Z`))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function sumarMes(mes: string, meses: number) {
  const [anio, numero] = mes.split("-").map(Number)
  return new Date(Date.UTC(anio, numero - 1 + meses, 1)).toISOString().slice(0, 7)
}

export function CalendarioDisponible({
  categoria,
  personas = 1,
  modo,
  desde,
  hasta,
  onElegir,
  validarRango,
}: {
  categoria: Categoria
  personas?: number
  modo: "dia" | "rango"
  desde: string
  hasta: string
  onElegir: (desde: string, hasta: string) => void
  validarRango?: (desde: string, hasta: string, meses: Record<string, DatosDelMes>) => string | null
}) {
  const hoy = hoyEnElPredio()
  const primerMes = hoy.slice(0, 7)
  const [mes, setMes] = useState((desde || hoy).slice(0, 7))
  const [meses, setMeses] = useState<Record<string, DatosDelMes>>({})
  const [fallo, setFallo] = useState(false)
  const [intento, setIntento] = useState(0)
  const clave = `${categoria}-${personas}`
  const datos = meses[`${clave}|${mes}`]

  useEffect(() => {
    if (datos) return
    const controlador = new AbortController()
    fetch(`/api/calendario?mes=${mes}&tipo=${categoria}&personas=${personas}`, { signal: controlador.signal })
      .then((respuesta) => respuesta.json())
      .then((json: { ok: boolean; error?: string } & DatosDelMes) => {
        if (!json.ok) throw new Error(json.error)
        setFallo(false)
        setMeses((actuales) => ({ ...actuales, [`${clave}|${mes}`]: json }))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFallo(true)
        avisarError(error instanceof Error && error.message ? error.message : falloDeRed().error, { id: "calendario", reintentar: reintentar })
      })
    return () => controlador.abort()
  }, [categoria, personas, clave, mes, datos, intento])

  function reintentar() {
    setFallo(false)
    setIntento((actual) => actual + 1)
  }

  function estadoDe(fecha: string) {
    return meses[`${clave}|${fecha.slice(0, 7)}`]?.dias[fecha]
  }

  function elegir(fecha: string) {
    if (modo === "dia" || !desde || hasta || fecha <= desde) {
      onElegir(fecha, modo === "dia" ? fecha : "")
      return
    }
    const rango = fechasEntre(desde, fecha)
    const tomado = rango.find((dia) => {
      const estado = estadoDe(dia)
      return estado && estado.estado !== "libre"
    })
    if (tomado) {
      avisarRevisar(`El ${fechaLarga(tomado).toLowerCase()} ya está ocupado, así que la estadía no puede pasar por ese día. Elegí una salida anterior.`, "rango")
      return
    }
    const problema = validarRango?.(desde, fecha, Object.fromEntries(Object.entries(meses).filter(([nombre]) => nombre.startsWith(`${clave}|`)).map(([nombre, valor]) => [nombre.split("|")[1], valor])))
    if (problema) {
      avisarRevisar(problema, "rango")
      return
    }
    onElegir(desde, fecha)
  }

  const inicio = `${mes}-01`
  const ultimo = sumarDiasIso(`${sumarMes(mes, 1)}-01`, -1)
  const desplazamiento = (diaDeLaSemana(inicio) + 6) % 7
  const fin = modo === "dia" ? desde : hasta

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-ink/15 bg-white disabled:opacity-30"
          aria-label="Mes anterior"
          disabled={mes <= primerMes}
          onClick={() => setMes(sumarMes(mes, -1))}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="font-display text-2xl tracking-tight">{tituloDelMes(inicio)}</p>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-ink/15 bg-white disabled:opacity-30"
          aria-label="Mes siguiente"
          disabled={mes >= sumarMes(primerMes, 12)}
          onClick={() => setMes(sumarMes(mes, 1))}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      {fallo ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/70">
          Este mes no se cargó.
          <button type="button" className="font-semibold text-lake-ink underline underline-offset-4" onClick={reintentar}>
            Volver a intentar
          </button>
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-ink/50">
        {nombresDeDia.map((letra, indice) => (
          <span key={indice}>{letra}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5" aria-busy={!datos && !fallo}>
        {Array.from({ length: desplazamiento }, (_, indice) => (
          <span key={`vacio-${indice}`} aria-hidden />
        ))}
        {fechasEntre(inicio, ultimo).map((fecha) => {
          const estado = datos?.dias[fecha]
          const libre = estado?.estado === "libre"
          const elegido = fecha === desde || fecha === fin
          const enRango = modo === "rango" && desde && hasta && fecha > desde && fecha < hasta
          const motivo =
            estado?.estado === "cerrado" ? estado.motivo : estado?.estado === "completo" ? "Sin lugar" : estado?.estado === "pasado" ? "Ya pasó" : ""
          return (
            <button
              key={fecha}
              type="button"
              disabled={!libre}
              title={motivo || undefined}
              aria-label={`${fechaLarga(fecha)}${!estado ? ": cargando" : motivo ? `: ${motivo}` : ": disponible"}`}
              aria-pressed={elegido}
              onClick={() => elegir(fecha)}
              className={cn(
                "aspect-square rounded-xl border text-sm font-semibold transition md:text-base",
                !estado && "border-ink/5 bg-ink/5 text-ink/30",
                !estado && !fallo && "animate-pulse",
                libre && "border-[#9fd18f] bg-[#eaf6e4] text-[#2f5d16] hover:bg-[#d6eecb]",
                (estado?.estado === "completo" || estado?.estado === "cerrado") && "border-[#f3c1b8] bg-[#fde8e4] text-[#a0453a]/70",
                estado?.estado === "pasado" && "border-transparent bg-transparent text-ink/25",
                enRango && "border-orange/50 bg-orange/15 text-ink",
                elegido && "border-orange bg-orange text-sobre-naranja hover:bg-orange",
              )}
            >
              {Number(fecha.slice(8))}
            </button>
          )
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-ink/60" aria-label="Referencias">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded border border-[#9fd18f] bg-[#eaf6e4]" /> Disponible
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded border border-[#f3c1b8] bg-[#fde8e4]" /> Sin lugar o cerrado
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded bg-orange" /> Elegido
        </li>
      </ul>

      {modo === "rango" && desde && !hasta ? (
        <p className="mt-4 text-sm font-semibold text-ink/70">Llegada el {fechaLarga(desde).toLowerCase()}. Ahora tocá el día de salida.</p>
      ) : null}
    </div>
  )
}
