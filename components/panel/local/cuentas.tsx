"use client"

import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

import { abrirCuenta, agregarAlPedido, borrarCuenta, cambiarCantidad, cobrarCuenta, reabrirCuenta } from "@/app/panel/locales/acciones"
import { Button } from "@/components/ui/button"
import { avisarError, avisarExito, avisarRevisar, conAviso, llamar } from "@/lib/avisos"
import type { CuentaDelDia, ItemDelMenu } from "@/lib/panel/cuentas"
import { porCategoria, type Local } from "@/lib/panel/local"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

type Forma = "EFECTIVO" | "DEBITO" | "TRANSFERENCIA"
const formas: { id: Forma; nombre: string }[] = [
  { id: "EFECTIVO", nombre: "Efectivo" },
  { id: "DEBITO", nombre: "Débito" },
  { id: "TRANSFERENCIA", nombre: "Transferencia" },
]
const nombreDeForma: Record<Forma, string> = { EFECTIVO: "efectivo", DEBITO: "débito", TRANSFERENCIA: "transferencia" }

export type MesaReservada = { reservaId: number; mesa: string; titular: string; horario: string }

const campo = "h-11 rounded-xl border border-panel-line bg-white px-3 text-base text-panel-ink"

/// Abrir una cuenta: con un toque desde una reserva del día, o eligiendo la mesa.
export function AbrirCuenta({ local, fecha, mesas, reservadas }: { local: Local; fecha: string; mesas: string[]; reservadas: MesaReservada[] }) {
  const [pendiente, iniciar] = useTransition()
  const [mesa, setMesa] = useState(mesas[0] ?? "")

  function abrir(datos: { mesa: string; titular?: string; reservaId?: number }) {
    iniciar(async () => void (await conAviso(() => abrirCuenta({ local, fecha, ...datos }), `Listo, se abrió la cuenta de ${datos.mesa}.`)))
  }

  return (
    <div className="space-y-3">
      {reservadas.length ? (
        <div>
          <p className="text-sm font-semibold text-panel-muted">Reservas de hoy sin cuenta</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {reservadas.map((reserva) => (
              <button
                key={reserva.reservaId}
                type="button"
                disabled={pendiente}
                onClick={() => abrir({ mesa: reserva.mesa, titular: reserva.titular, reservaId: reserva.reservaId })}
                className="rounded-2xl border-2 border-panel-line bg-white px-3 py-2 text-left text-sm hover:border-panel-ink"
              >
                <span className="block font-bold">{reserva.mesa}</span>
                <span className="block text-panel-muted">
                  {reserva.titular} · {reserva.horario}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(evento) => {
          evento.preventDefault()
          const datos = new FormData(evento.currentTarget)
          const elegida = (mesas.length > 1 ? mesa : String(datos.get("mesa") ?? "")).trim()
          if (!elegida) {
            avisarRevisar("Escribí la mesa o el lugar.")
            return
          }
          abrir({ mesa: elegida, titular: String(datos.get("titular") ?? "").trim() || undefined })
          evento.currentTarget.reset()
        }}
      >
        <label className="text-sm font-semibold text-panel-muted">
          {mesas.length > 1 ? "Mesa" : "Dónde"}
          {mesas.length > 1 ? (
            <select value={mesa} onChange={(evento) => setMesa(evento.target.value)} className={cn(campo, "mt-1 block")}>
              {mesas.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : (
            <input name="mesa" defaultValue={mesas[0]} placeholder="Barra, deck, sombrilla 4" maxLength={30} className={cn(campo, "mt-1 block w-44")} />
          )}
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          A nombre de (opcional)
          <input name="titular" maxLength={80} placeholder="Gómez" className={cn(campo, "mt-1 block w-44")} />
        </label>
        <Button type="submit" disabled={pendiente} className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado">
          <Plus className="size-4" aria-hidden />
          Abrir cuenta
        </Button>
      </form>
    </div>
  )
}

function AgregarAlPedido({ cuentaId, menu }: { cuentaId: number; menu: ItemDelMenu[] }) {
  const [pendiente, iniciar] = useTransition()
  const [plato, setPlato] = useState("")
  const [fueraDeCarta, setFueraDeCarta] = useState(menu.length === 0)
  const grupos = porCategoria(menu.filter((item) => item.disponible))

  function agregar(pedido: Parameters<typeof agregarAlPedido>[0], nombre: string) {
    iniciar(async () => {
      const resultado = await llamar(() => agregarAlPedido(pedido))
      if (!resultado.ok) avisarError(resultado.error)
      else {
        avisarExito(`Sumado: ${nombre}.`)
        setPlato("")
      }
    })
  }

  if (fueraDeCarta) {
    return (
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(evento) => {
          evento.preventDefault()
          const formulario = evento.currentTarget
          const datos = new FormData(formulario)
          const nombre = String(datos.get("nombre") ?? "").trim()
          const precio = Number(String(datos.get("precio") ?? "").replace(/\D/g, ""))
          if (nombre.length < 2 || !precio) {
            avisarRevisar("Escribí qué es y cuánto sale.")
            return
          }
          agregar({ cuentaId, nombre, precio }, nombre)
          formulario.reset()
        }}
      >
        <input name="nombre" placeholder="Qué es" aria-label="Qué es" maxLength={80} className={cn(campo, "min-w-0 flex-1")} />
        <input name="precio" placeholder="Precio" aria-label="Precio" inputMode="numeric" className={cn(campo, "w-28")} />
        <Button type="submit" disabled={pendiente} className="h-11 bg-panel-ink px-4 text-white hover:bg-panel-tostado">
          Sumar
        </Button>
        {menu.length ? (
          <button type="button" onClick={() => setFueraDeCarta(false)} className="h-11 text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
            Elegir de la carta
          </button>
        ) : null}
      </form>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={plato}
        aria-label="Plato de la carta"
        onChange={(evento) => {
          const elegido = menu.find((item) => String(item.id) === evento.target.value)
          setPlato(evento.target.value)
          if (elegido) agregar({ cuentaId, menuItemId: elegido.id }, elegido.nombre)
        }}
        disabled={pendiente}
        className={cn(campo, "w-full min-w-0 sm:w-auto sm:flex-1")}
      >
        <option value="">+ Sumar algo de la carta…</option>
        {grupos.map((grupo) => (
          <optgroup key={grupo.categoria} label={grupo.categoria}>
            {grupo.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre} · {pesos(item.precio)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button type="button" onClick={() => setFueraDeCarta(true)} className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
        Algo fuera de la carta
      </button>
    </div>
  )
}

/// Una mesa con su pedido. Abierta: se suma, se corrigen cantidades y se cobra. Cobrada:
/// se ve cómo se pagó y se puede reabrir.
export function TarjetaDeCuenta({ cuenta, menu }: { cuenta: CuentaDelDia; menu: ItemDelMenu[] }) {
  const [pendiente, iniciar] = useTransition()
  const abierta = cuenta.estado === "ABIERTA"

  return (
    <li
      className={cn(
        "min-w-0 rounded-3xl border-2 border-l-8 p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5",
        abierta ? (cuenta.total ? "border-[#f0b266] border-l-[#e8890c] bg-[#ffeedb]" : "border-panel-line border-l-panel-muted bg-white") : "border-[#8fcf88] border-l-[#2e7d32] bg-[#e6f5e4]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl tracking-tight">{cuenta.mesa}</p>
          {cuenta.titular ? <p className="text-base font-semibold">{cuenta.titular}</p> : null}
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap",
            abierta ? "bg-[#f5a13a] text-[#2e1900]" : "bg-[#2e7d32] text-white",
          )}
        >
          {abierta ? (cuenta.total ? "Pendiente de cobro" : "Sin pedido") : `Cobrada en ${nombreDeForma[cuenta.forma as Forma]}`}
        </span>
      </div>

      {cuenta.items.length ? (
        <ul className="mt-3 divide-y divide-black/5 rounded-2xl bg-white/80 px-3">
          {cuenta.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              {abierta ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pendiente}
                    aria-label={`Uno menos de ${item.nombre}`}
                    onClick={() => iniciar(async () => void (await conAviso(() => cambiarCantidad({ itemId: item.id, cantidad: item.cantidad - 1 }), item.cantidad === 1 ? `Sacado: ${item.nombre}.` : `Uno menos de ${item.nombre}.`)))}
                    className="grid size-8 place-items-center rounded-full border border-panel-line bg-white hover:border-panel-muted"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="w-6 text-center font-bold tabular-nums">{item.cantidad}</span>
                  <button
                    type="button"
                    disabled={pendiente}
                    aria-label={`Uno más de ${item.nombre}`}
                    onClick={() => iniciar(async () => void (await conAviso(() => cambiarCantidad({ itemId: item.id, cantidad: item.cantidad + 1 }), `Uno más de ${item.nombre}.`)))}
                    className="grid size-8 place-items-center rounded-full border border-panel-line bg-white hover:border-panel-muted"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </span>
              ) : (
                <span className="w-8 font-bold tabular-nums">{item.cantidad} ×</span>
              )}
              <span className="min-w-0 flex-1 truncate">{item.nombre}</span>
              <span className="hidden text-sm text-panel-muted tabular-nums sm:inline">{item.cantidad > 1 ? `${pesos(item.precio)} c/u` : ""}</span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{pesos(item.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-panel-muted">Todavía no pidieron nada.</p>
      )}

      <p className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-semibold">Total</span>
        <span className="font-display text-3xl tracking-tight tabular-nums">{pesos(cuenta.total)}</span>
      </p>

      {abierta ? (
        <div className="mt-3 space-y-3">
          <AgregarAlPedido cuentaId={cuenta.id} menu={menu} />
          {cuenta.total ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Cobrar:</span>
              {formas.map((forma) => (
                <Button
                  key={forma.id}
                  type="button"
                  variant="outline"
                  disabled={pendiente}
                  className="h-11 bg-white px-4"
                  onClick={() => {
                    if (!window.confirm(`¿Cobrar ${pesos(cuenta.total)} en ${nombreDeForma[forma.id]} a ${cuenta.mesa}?`)) return
                    iniciar(async () => void (await conAviso(() => cobrarCuenta({ cuentaId: cuenta.id, forma: forma.id }), `Listo, ${cuenta.mesa} quedó cobrada: ${pesos(cuenta.total)} en ${nombreDeForma[forma.id]}.`)))
                  }}
                >
                  {forma.nombre}
                </Button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                if (!window.confirm(`¿Borrar la cuenta vacía de ${cuenta.mesa}?`)) return
                iniciar(async () => void (await conAviso(() => borrarCuenta({ cuentaId: cuenta.id }), `Listo, se borró la cuenta de ${cuenta.mesa}.`)))
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-panel-muted hover:text-[#c62828]"
            >
              <Trash2 className="size-4" aria-hidden />
              Borrar cuenta vacía
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-panel-ink/70">
          <span>{cuenta.cobradaPor ? `Cobró ${cuenta.cobradaPor}` : ""}</span>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (!window.confirm(`¿Reabrir la cuenta de ${cuenta.mesa}? Vuelve a figurar como pendiente de cobro.`)) return
              iniciar(async () => void (await conAviso(() => reabrirCuenta({ cuentaId: cuenta.id }), `Listo, la cuenta de ${cuenta.mesa} está abierta otra vez.`)))
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-panel-tostado underline-offset-4 hover:underline"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reabrir
          </button>
        </div>
      )}
    </li>
  )
}
