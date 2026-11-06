"use client"

import { CalendarClock, Check, ExternalLink, LogIn, LogOut, PanelRightOpen, Undo2, Users, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"

import { cobrar, registrarAsistencia } from "@/app/panel/puerta/acciones"
import { AsistenciaDelGrupo, type Integrante } from "@/components/panel/asistencia-grupo"
import { EstadoEditable } from "@/components/panel/estado-editable"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import type { Asistencia, Movimiento } from "@/lib/panel/asistencia"
import type { FormaDeCobro } from "@/lib/panel/cobros"
import type { EstadoVisible } from "@/lib/panel/estados"
import { fechaLarga } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export type DatosDeLlegada = {
  id: number
  codigo: string
  token: string
  titular: string
  propuesta: string
  modificable: boolean
  horario: string
  lugares: string[]
  personas: number
  dni: string | null
  telefono: string | null
  desde: string
  hasta: string
  visible: EstadoVisible
  asistencia: { porPersona: boolean; estado: Asistencia; adentro: number; salieron: number; total: number }
  integrantes: Integrante[]
  ingreso: { hora: string; por: string | null } | null
  saldo: number | null
  efectivo: number | null
  aConfirmar: boolean
  consumo: boolean
}

const nombreDeForma: Record<FormaDeCobro, string> = { EFECTIVO: "efectivo", DEBITO: "débito", TRANSFERENCIA: "transferencia" }
const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

/// La ficha de una reserva dentro de Puerta: se abre de costado (pantalla completa en el
/// celular) con todo lo que se hace en la entrada, separado en ingreso, cobro y cambios.
export function FichaDeLlegada({ llegada, hoy, puedeConfirmar }: { llegada: DatosDeLlegada; hoy: string; puedeConfirmar: boolean }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-panel-ink px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-panel-tostado"
        aria-label={`Abrir la ficha de ${llegada.titular}`}
      >
        <PanelRightOpen className="size-4" aria-hidden />
        Abrir
      </button>
      {abierta ? <Ficha llegada={llegada} hoy={hoy} puedeConfirmar={puedeConfirmar} onCerrar={() => setAbierta(false)} /> : null}
    </>
  )
}

function Ficha({ llegada, hoy, puedeConfirmar, onCerrar }: { llegada: DatosDeLlegada; hoy: string; puedeConfirmar: boolean; onCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  // Se abre como modal al montarse: el foco queda adentro y Escape la cierra.
  useEffect(() => {
    dialogo.current?.showModal()
  }, [])

  const otroDia = llegada.desde > hoy ? "futuro" : llegada.hasta < hoy ? "pasado" : null

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-labelledby={`ficha-${llegada.id}`}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-full overflow-y-auto bg-panel p-0 text-left text-panel-ink backdrop:bg-black/40 sm:w-[36rem]"
    >
      <header className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-panel-line bg-white px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">
            {llegada.propuesta} · {llegada.codigo}
          </p>
          <h2 id={`ficha-${llegada.id}`} className="font-display text-2xl leading-tight tracking-tight">
            {llegada.titular}
          </h2>
        </div>
        <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar la ficha" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        <section className={cn("rounded-3xl bg-white p-4", sombra)} aria-label="Datos de la reserva">
          <div className="flex flex-wrap items-center gap-3">
            <EstadoEditable
              id={llegada.id}
              codigo={llegada.codigo}
              titular={llegada.titular}
              visible={llegada.visible}
              desde={llegada.desde}
              hasta={llegada.hasta}
              hoy={hoy}
              puedeConfirmar={puedeConfirmar}
              puedeMarcar
            />
            <span className="text-sm text-panel-muted">Tocá el estado para cambiarlo.</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Dato termino="Día">{fechaLarga(llegada.desde)}</Dato>
            <Dato termino="Horario">{llegada.horario}</Dato>
            <Dato termino="Personas">{llegada.personas}</Dato>
            <Dato termino="Lugar">{llegada.lugares.join(", ") || "Sin lugar"}</Dato>
            {llegada.dni ? <Dato termino="DNI">{llegada.dni}</Dato> : null}
            {llegada.telefono ? <Dato termino="Teléfono">{llegada.telefono}</Dato> : null}
          </dl>
        </section>

        <SeccionIngreso llegada={llegada} otroDia={otroDia} />
        <SeccionCobro llegada={llegada} otroDia={otroDia} />

        <section className={cn("rounded-3xl bg-white p-4", sombra)} aria-labelledby={`cambios-${llegada.id}`}>
          <h3 id={`cambios-${llegada.id}`} className="font-display text-xl tracking-tight">
            Modificaciones
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {llegada.modificable ? (
              <a href={`/reserva/t/${llegada.token}/modificar`} target="_blank" rel="noreferrer" className={botonGrande()}>
                <CalendarClock className="size-5" aria-hidden />
                Cambiar día, lugar o personas
              </a>
            ) : null}
            <Link href={`/panel/reservas/${llegada.id}`} className={botonGrande()}>
              <ExternalLink className="size-5" aria-hidden />
              Ver la reserva completa
            </Link>
          </div>
          {!llegada.modificable ? <p className="mt-2 text-xs text-panel-muted">El día y el lugar se cambian desde la reserva completa o por WhatsApp con el titular.</p> : null}
        </section>
      </div>
    </dialog>
  )
}

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{termino}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  )
}

const botonGrande = (activo = false) =>
  cn(
    "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition disabled:opacity-50",
    activo ? "border-[#2e7d32] bg-[#e6f5e4] text-[#1b5e20]" : "border-panel-line bg-white hover:border-panel-ink",
  )

function SeccionIngreso({ llegada, otroDia }: { llegada: DatosDeLlegada; otroDia: "futuro" | "pasado" | null }) {
  const [pendiente, iniciar] = useTransition()
  const [parcial, setParcial] = useState(false)
  const { asistencia } = llegada
  const nadie = asistencia.adentro + asistencia.salieron === 0
  const todos = asistencia.adentro === asistencia.total && asistencia.total > 0

  function mover(movimiento: Movimiento, exito: string) {
    if (movimiento === "ingreso" && otroDia === "futuro") {
      avisarRevisar(`Esta reserva es para el ${fechaLarga(llegada.desde).toLowerCase()}: el ingreso se marca ese día. Si llegaron hoy, primero modificá la fecha de la reserva.`)
      return
    }
    iniciar(async () => void (await conAviso(() => registrarAsistencia({ reservaId: llegada.id, movimiento }), exito)))
  }

  return (
    <section className={cn("rounded-3xl bg-white p-4", sombra)} aria-labelledby={`ingreso-${llegada.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`ingreso-${llegada.id}`} className="font-display text-xl tracking-tight">
          Ingreso
        </h3>
        <p className="text-sm text-panel-muted">
          {asistencia.adentro} de {asistencia.total} adentro
          {asistencia.salieron ? ` · ${asistencia.salieron} ya se ${asistencia.salieron === 1 ? "fue" : "fueron"}` : ""}
          {llegada.ingreso ? ` · desde las ${llegada.ingreso.hora}${llegada.ingreso.por ? ` (${llegada.ingreso.por})` : ""}` : ""}
        </p>
      </div>
      {otroDia === "futuro" ? (
        <p className="mt-2 rounded-2xl bg-[#fff7d6] px-3 py-2 text-sm text-[#3d2f00]">
          Es para el {fechaLarga(llegada.desde).toLowerCase()}: el ingreso se marca ese día. Si llegaron hoy, primero cambiá la fecha (abajo, en Modificaciones).
        </p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={pendiente || todos} onClick={() => mover("ingreso", `Listo, ${llegada.titular} ya figura adentro.`)} className={botonGrande(todos)}>
              {todos ? <Check className="size-5" aria-hidden /> : <LogIn className="size-5" aria-hidden />}
              {todos ? "Ingresó todo el grupo" : nadie ? "Ingreso total" : "Ingresó el resto"}
            </button>
            {asistencia.porPersona ? (
              <button type="button" aria-expanded={parcial} onClick={() => setParcial(!parcial)} className={botonGrande(parcial)}>
                <Users className="size-5" aria-hidden />
                Ingreso parcial
              </button>
            ) : null}
            {asistencia.adentro > 0 ? (
              <button type="button" disabled={pendiente} onClick={() => mover("salida", `Listo, ${llegada.titular} figura como que ya se fue.`)} className={botonGrande()}>
                <LogOut className="size-5" aria-hidden />
                Se fue todo el grupo
              </button>
            ) : null}
            {!nadie ? (
              <button type="button" disabled={pendiente} onClick={() => mover("deshacer", "Listo, se deshizo el último paso.")} className={botonGrande()}>
                <Undo2 className="size-5" aria-hidden />
                Deshacer el último paso
              </button>
            ) : null}
          </div>
          {parcial && asistencia.porPersona ? (
            <div className="mt-3 rounded-2xl border border-panel-line p-3">
              <p className="mb-2 text-sm text-panel-muted">Marcá quiénes entraron.</p>
              <AsistenciaDelGrupo reservaId={llegada.id} integrantes={llegada.integrantes} puedeMarcar />
            </div>
          ) : null}
          {!asistencia.porPersona ? <p className="mt-2 text-xs text-panel-muted">Esta reserva se cargó por cantidad: el ingreso es del grupo entero.</p> : null}
        </>
      )}
    </section>
  )
}

function SeccionCobro({ llegada, otroDia }: { llegada: DatosDeLlegada; otroDia: "futuro" | "pasado" | null }) {
  const [pendiente, iniciar] = useTransition()
  const [modo, setModo] = useState<"total" | "parcial">("total")
  const nadieEntro = llegada.asistencia.adentro + llegada.asistencia.salieron === 0
  const [ingresanAlCobrar, setIngresanAlCobrar] = useState(true)
  const { saldo, efectivo } = llegada

  function cobrarAhora(forma: FormaDeCobro, importe?: number) {
    const monto = importe ?? (forma === "EFECTIVO" ? (efectivo ?? 0) : (saldo ?? 0))
    // Solo el cobro total marca el ingreso de todos; uno parcial no.
    const ingresan = !otroDia && nadieEntro && ingresanAlCobrar && importe === undefined
    if (!window.confirm(`¿Cobrar ${pesos(monto)} en ${nombreDeForma[forma]}${ingresan ? " y marcar que ingresaron todos" : ""}?`)) return
    iniciar(async () => {
      const resultado = await conAviso(
        () => cobrar({ id: llegada.id, forma, importe }),
        (cobro) => `Listo, quedaron cobrados ${pesos(cobro.importe)} en ${nombreDeForma[forma]} a ${llegada.titular}.${otroDia === "futuro" ? " Entra a la caja el día que lleguen." : ""}`,
      )
      if (resultado.ok && ingresan) await conAviso(() => registrarAsistencia({ reservaId: llegada.id, movimiento: "ingreso" }), "Y ya figuran adentro.")
    })
  }

  return (
    <section className={cn("rounded-3xl bg-white p-4", sombra)} aria-labelledby={`cobro-${llegada.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`cobro-${llegada.id}`} className="font-display text-xl tracking-tight">
          Cobro
        </h3>
        <p className="font-semibold">
          {llegada.consumo ? "Consumo aparte" : llegada.aConfirmar ? "A presupuestar" : saldo ? `Saldo ${pesos(saldo)}` : <span className="text-[#3f6b12]">Pagado</span>}
        </p>
      </div>
      {llegada.consumo || llegada.aConfirmar ? (
        <p className="mt-2 text-sm text-panel-muted">{llegada.consumo ? "Paga lo que consume en el restaurante." : "El precio lo arma el predio: cobrá una seña o el total como cobro parcial."}</p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={modo === "total"} disabled={!saldo} onClick={() => setModo("total")} className={botonGrande(modo === "total" && Boolean(saldo))}>
          Cobro total
        </button>
        <button type="button" aria-pressed={modo === "parcial"} onClick={() => setModo("parcial")} className={botonGrande(modo === "parcial" || !saldo)}>
          {otroDia === "futuro" ? "Seña o parcial" : "Cobro parcial"}
        </button>
      </div>

      {modo === "total" && saldo ? (
        <div className="mt-3 space-y-3">
          {!otroDia && nadieEntro ? (
            <label className="flex items-center gap-3 rounded-2xl bg-panel px-3 py-2.5 text-sm font-semibold">
              <input type="checkbox" checked={ingresanAlCobrar} onChange={(evento) => setIngresanAlCobrar(evento.target.checked)} className="size-5 accent-[#3a2a18]" />
              Al cobrar, marcar que ingresó todo el grupo
            </label>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={pendiente} onClick={() => cobrarAhora("EFECTIVO")} className={cn(botonGrande(), "flex-col items-start gap-0.5")}>
              Efectivo
              <span className="font-display text-lg tabular-nums">{pesos(efectivo ?? saldo)}</span>
            </button>
            <button type="button" disabled={pendiente} onClick={() => cobrarAhora("DEBITO")} className={cn(botonGrande(), "flex-col items-start gap-0.5")}>
              Débito
              <span className="font-display text-lg tabular-nums">{pesos(saldo)}</span>
            </button>
            <button type="button" disabled={pendiente} onClick={() => cobrarAhora("TRANSFERENCIA")} className={cn(botonGrande(), "flex-col items-start gap-0.5")}>
              Transferencia
              <span className="font-display text-lg tabular-nums">{pesos(saldo)}</span>
            </button>
          </div>
        </div>
      ) : (
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(evento) => {
            evento.preventDefault()
            const datos = new FormData(evento.currentTarget)
            const importe = Number(String(datos.get("importe")).replace(/\D/g, ""))
            if (!importe) return avisarRevisar("Escribí cuánto vas a cobrar, en pesos y sin puntos.")
            cobrarAhora(datos.get("forma") as FormaDeCobro, importe)
          }}
        >
          <label className="text-sm font-semibold">
            Importe
            <input name="importe" inputMode="numeric" placeholder="40000" className="mt-1 block h-12 w-full rounded-xl border border-panel-line bg-white px-3 text-base" />
          </label>
          <label className="text-sm font-semibold">
            Forma
            <select name="forma" className="mt-1 block h-12 w-full rounded-xl border border-panel-line bg-white px-3 text-base">
              <option value="EFECTIVO">Efectivo</option>
              <option value="DEBITO">Débito</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </label>
          <button type="submit" disabled={pendiente} className="h-12 rounded-full bg-panel-naranja px-6 font-bold text-white hover:bg-panel-tostado disabled:opacity-60">
            Cobrar
          </button>
        </form>
      )}
    </section>
  )
}
