"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

import { registrarAsistencia } from "@/app/panel/puerta/acciones"
import { cancelarReserva, confirmarReserva, volverAConfirmar } from "@/app/panel/reservas/acciones"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import { estilosDeEstado, type EstadoVisible } from "@/lib/panel/estados"
import { fechaLarga } from "@/lib/predio/fechas"
import { cn } from "cn"

type Opcion = { id: string; nombre: string; peligro?: boolean; hacer: () => void }

/// La etiqueta del estado, que se toca para cambiarlo a mano. Solo ofrece los pasos que
/// tienen sentido desde el estado actual, y antes de pedirlos revisa la fecha: el ingreso
/// de una reserva de otro día no se marca, y se sugiere modificarla.
export function EstadoEditable({
  id,
  codigo,
  titular,
  visible,
  desde,
  hasta,
  hoy,
  puedeConfirmar,
  puedeMarcar,
}: {
  id: number
  codigo: string
  titular: string
  visible: EstadoVisible
  desde: string
  hasta: string
  hoy: string
  puedeConfirmar: boolean
  puedeMarcar: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [pendiente, iniciar] = useTransition()
  const contenedor = useRef<HTMLDivElement>(null)

  // Cierra el menú al tocar afuera o con Escape; el efecto existe solo mientras está abierto.
  useEffect(() => {
    if (!abierto) return
    const fuera = (evento: PointerEvent) => !contenedor.current?.contains(evento.target as Node) && setAbierto(false)
    const escape = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierto(false)
    document.addEventListener("pointerdown", fuera)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", fuera)
      document.removeEventListener("keydown", escape)
    }
  }, [abierto])

  function correr(tarea: () => Promise<unknown>) {
    setAbierto(false)
    iniciar(async () => void (await tarea()))
  }

  function ingreso() {
    if (desde > hoy) {
      avisarRevisar(`La reserva ${codigo} es para el ${fechaLarga(desde).toLowerCase()}: el ingreso se marca ese día. Si llegaron hoy, primero modificá la fecha de la reserva.`)
      setAbierto(false)
      return
    }
    if (hasta < hoy) {
      avisarRevisar(`La reserva ${codigo} era del ${fechaLarga(desde).toLowerCase()}. Si vinieron otro día, modificá la fecha de la reserva.`)
      setAbierto(false)
      return
    }
    correr(() => conAviso(() => registrarAsistencia({ reservaId: id, movimiento: "ingreso" }), `Listo, ${titular} ya figura adentro.`))
  }

  const confirmar: Opcion = { id: "confirmar", nombre: "Confirmada", hacer: () => correr(() => conAviso(() => confirmarReserva(id), `Listo, la reserva ${codigo} quedó confirmada.`)) }
  const aConfirmar: Opcion = { id: "a-confirmar", nombre: "A confirmar", hacer: () => correr(() => conAviso(() => volverAConfirmar(id), `La reserva ${codigo} volvió a «a confirmar».`)) }
  const cancelar: Opcion = {
    id: "cancelar",
    nombre: "Cancelar la reserva",
    peligro: true,
    hacer: () => {
      if (!window.confirm(`¿Cancelar la reserva ${codigo} de ${titular}? Se liberan sus lugares.`)) return setAbierto(false)
      correr(() => conAviso(() => cancelarReserva(id), `Listo, la reserva ${codigo} quedó cancelada.`))
    },
  }
  const ingresaron: Opcion = { id: "ingreso", nombre: visible === "parcial" ? "Ingresó el resto del grupo" : "Ingresó todo el grupo", hacer: ingreso }
  const seFueron: Opcion = { id: "salida", nombre: "Se fue todo el grupo", hacer: () => correr(() => conAviso(() => registrarAsistencia({ reservaId: id, movimiento: "salida" }), `Listo, ${titular} figura como que ya se fue.`)) }
  const deshacer: Opcion = { id: "deshacer", nombre: "Deshacer el último paso", hacer: () => correr(() => conAviso(() => registrarAsistencia({ reservaId: id, movimiento: "deshacer" }), "Listo, se deshizo el último paso.")) }

  const opciones: Opcion[] = (
    {
      "a-confirmar": [puedeConfirmar && confirmar, puedeMarcar && ingresaron, puedeConfirmar && cancelar],
      confirmada: [puedeConfirmar && aConfirmar, puedeMarcar && ingresaron, puedeConfirmar && cancelar],
      parcial: [puedeMarcar && ingresaron, puedeMarcar && seFueron, puedeMarcar && deshacer],
      ingresada: [puedeMarcar && seFueron, puedeMarcar && deshacer],
      finalizada: [puedeMarcar && deshacer],
      "no-vino": [puedeMarcar && ingresaron, puedeConfirmar && cancelar],
      cancelada: [],
    } satisfies Record<EstadoVisible, (Opcion | false)[]>
  )[visible].flatMap((opcion) => (opcion ? [opcion] : []))

  const estilo = estilosDeEstado[visible]
  if (!opciones.length) {
    return <span className={cn("inline-flex h-9 items-center rounded-full px-3 text-sm font-bold", estilo.insignia)}>{estilo.nombre}</span>
  }
  return (
    <div ref={contenedor} className="relative z-10 inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Estado de la reserva ${codigo}: ${estilo.nombre}. Cambiar`}
        disabled={pendiente}
        onClick={() => setAbierto(!abierto)}
        className={cn("inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-bold whitespace-nowrap ring-offset-2 hover:ring-2 hover:ring-panel-ink/20 disabled:opacity-60", estilo.insignia)}
      >
        {pendiente ? "Guardando…" : estilo.nombre}
        <ChevronDown className="size-4" aria-hidden />
      </button>
      {abierto ? (
        <ul role="menu" aria-label={`Cambiar el estado de ${codigo}`} className="absolute top-full left-0 z-30 mt-1 min-w-56 overflow-hidden rounded-2xl border border-panel-line bg-white py-1 shadow-[0_16px_40px_rgba(58,42,24,0.18)]">
          {opciones.map((opcion) => (
            <li key={opcion.id} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={opcion.hacer}
                className={cn("block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-panel", opcion.peligro && "text-[#a32020]")}
              >
                {opcion.nombre}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
