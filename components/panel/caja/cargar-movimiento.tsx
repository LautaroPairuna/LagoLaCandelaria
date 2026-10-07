"use client"

import { Plus, X } from "lucide-react"
import { useState, useTransition } from "react"

import { cargarMovimiento } from "@/app/panel/caja/acciones"
import { Button } from "@/components/ui/button"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

type Tipo = "INGRESO" | "EGRESO" | "TRANSFERENCIA"
type Cajon = "EFECTIVO" | "BANCO"

const tipos: { id: Tipo; nombre: string; ayuda: string }[] = [
  { id: "EGRESO", nombre: "Egreso", ayuda: "Gastos, combustible, retiros" },
  { id: "INGRESO", nombre: "Ingreso", ayuda: "Plata que entra sin ser una reserva" },
  { id: "TRANSFERENCIA", nombre: "Pase entre cajones", ayuda: "Por ejemplo, depositar efectivo en el banco" },
]

const campo = "mt-1 block h-11 w-full rounded-xl border border-panel-line bg-white px-3 text-base text-panel-ink"

/// Carga un movimiento que no es el cobro de una reserva.
export function CargarMovimiento({ hoy }: { hoy: string }) {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<Tipo>("EGRESO")
  const [cajon, setCajon] = useState<Cajon>("EFECTIVO")
  const [pendiente, iniciar] = useTransition()

  if (!abierto) {
    return (
      <Button type="button" className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => setAbierto(true)}>
        <Plus className="size-4" aria-hidden />
        Cargar movimiento
      </Button>
    )
  }

  return (
    <form
      className="w-full rounded-3xl border-2 border-panel-ink/15 bg-white p-4 md:p-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        const formulario = evento.currentTarget
        const datos = new FormData(formulario)
        const monto = Number(String(datos.get("monto")).replace(/\D/g, ""))
        if (!monto) {
          avisarRevisar("Escribí el monto en pesos, sin puntos.")
          return
        }
        const concepto = String(datos.get("concepto") ?? "")
        iniciar(async () => {
          const resultado = await conAviso(
            () => cargarMovimiento({ tipo, cajon, fecha: String(datos.get("fecha")), concepto, monto }),
            tipo === "TRANSFERENCIA"
              ? `Listo, pasaste ${pesos(monto)} de ${cajon === "EFECTIVO" ? "efectivo al banco" : "banco a efectivo"}.`
              : `Listo, quedó cargado el ${tipo === "INGRESO" ? "ingreso" : "egreso"} de ${pesos(monto)}.`,
          )
          if (resultado.ok) {
            formulario.reset()
            setAbierto(false)
          }
        })
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl tracking-tight">Cargar movimiento</h3>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <fieldset className="mt-3">
        <legend className="text-sm font-semibold text-panel-muted">Tipo</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {tipos.map((item) => (
            <label
              key={item.id}
              className={cn("flex cursor-pointer gap-2.5 rounded-2xl border-2 px-3 py-2.5", tipo === item.id ? "border-panel-ink bg-panel" : "border-panel-line hover:border-panel-muted")}
            >
              <input type="radio" name="tipo" checked={tipo === item.id} onChange={() => setTipo(item.id)} className="mt-1 size-4 accent-[#3a2a18]" />
              <span>
                <span className="block font-semibold">{item.nombre}</span>
                <span className="text-xs text-panel-muted">{item.ayuda}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-panel-muted">
          {tipo === "TRANSFERENCIA" ? "Pasa" : "Cajón"}
          <select className={campo} value={cajon} onChange={(evento) => setCajon(evento.target.value as Cajon)}>
            {tipo === "TRANSFERENCIA" ? (
              <>
                <option value="EFECTIVO">De efectivo al banco</option>
                <option value="BANCO">Del banco a efectivo</option>
              </>
            ) : (
              <>
                <option value="EFECTIVO">Efectivo</option>
                <option value="BANCO">Banco (transferencia, tarjeta)</option>
              </>
            )}
          </select>
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          Fecha
          <input type="date" name="fecha" defaultValue={hoy} max={hoy} required className={campo} />
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          Monto
          <input name="monto" inputMode="numeric" placeholder="15000" required className={campo} />
        </label>
        <label className="text-sm font-semibold text-panel-muted sm:col-span-2 lg:col-span-1">
          Concepto
          <input name="concepto" maxLength={160} placeholder="Combustible del tractor" required className={campo} />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={pendiente} className="h-11 bg-panel-naranja px-6 text-white hover:bg-panel-tostado">
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
