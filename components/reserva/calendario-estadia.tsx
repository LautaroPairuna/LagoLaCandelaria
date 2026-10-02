"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "cn"
import { esFecha, fechaLarga, hoyIso } from "@/lib/solicitud"

const semana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function isoDe(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

export function CalendarioEstadia({
  modo,
  desde,
  hasta,
  onChange,
}: {
  modo: "dia" | "noche"
  desde: string
  hasta: string
  onChange: (desde: string, hasta: string) => void
}) {
  const ancla = esFecha(desde) ? desde : hoyIso()
  const [anio, mes] = ancla.split("-").map(Number)
  const [vista, setVista] = useState({ anio, mes: mes - 1 })

  const celdas = useMemo(() => {
    const primero = new Date(vista.anio, vista.mes, 1)
    const offset = (primero.getDay() + 6) % 7
    const cantidad = new Date(vista.anio, vista.mes + 1, 0).getDate()
    const dias = Array.from({ length: cantidad }, (_, index) => index + 1)
    return { offset, dias }
  }, [vista])

  const titulo = new Date(vista.anio, vista.mes, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })
  const hoy = hoyIso()
  const fin = modo === "dia" ? desde : hasta

  function mover(delta: number) {
    const siguiente = new Date(vista.anio, vista.mes + delta, 1)
    setVista({ anio: siguiente.getFullYear(), mes: siguiente.getMonth() })
  }

  function elegir(iso: string) {
    if (iso < hoy) return
    if (modo === "dia") {
      onChange(iso, iso)
      return
    }
    if (!desde || (desde && hasta)) {
      onChange(iso, "")
      return
    }
    if (iso <= desde) {
      onChange(iso, "")
      return
    }
    onChange(desde, iso)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-ink/10 bg-white text-ink hover:bg-lake-soft"
          onClick={() => mover(-1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft />
        </button>
        <p className="font-display text-2xl tracking-tight capitalize">{titulo}</p>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-ink/10 bg-white text-ink hover:bg-lake-soft"
          onClick={() => mover(1)}
          aria-label="Mes siguiente"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-ink/50 uppercase">
        {semana.map((dia) => (
          <span key={dia} className="py-2">
            {dia}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: celdas.offset }, (_, index) => (
          <span key={`vacio-${index}`} />
        ))}
        {celdas.dias.map((dia) => {
          const iso = isoDe(vista.anio, vista.mes, dia)
          const pasado = iso < hoy
          const elegido = iso === desde || (fin !== "" && iso === fin)
          const enRango = desde !== "" && fin !== "" && iso > desde && iso < fin
          const finde = new Date(vista.anio, vista.mes, dia).getDay() % 6 === 0
          return (
            <button
              key={iso}
              type="button"
              disabled={pasado}
              onClick={() => elegir(iso)}
              aria-pressed={elegido || enRango}
              aria-label={fechaLarga(iso)}
              className={cn(
                "h-11 rounded-xl border-2 text-sm font-semibold transition",
                pasado && "cursor-not-allowed border-transparent text-ink/25",
                !pasado && !elegido && !enRango && "border-orange bg-white text-ink hover:bg-[#fff7f0]",
                finde && !elegido && !enRango && !pasado && "text-lake-ink",
                enRango && "border-orange bg-orange text-white",
                elegido && "border-orange bg-orange text-white",
              )}
            >
              {dia}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">
        {modo === "dia"
          ? "Elegí el día de la visita. Los sábados y domingos están en azul: el predio abre esos días y los feriados, de 10 a 19."
          : "Primer toque: día de llegada. Segundo toque: día de salida. Tiene que haber al menos una noche en el medio."}
      </p>
    </div>
  )
}
