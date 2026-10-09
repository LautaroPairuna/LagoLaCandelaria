"use client"

import { Minus, Plus, UserPlus, X } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

import { reservarEnElPredio } from "@/app/panel/reservas/alta"
import { Button } from "@/components/ui/button"
import { avisarError, avisarExito, avisarRevisar, llamar } from "@/lib/avisos"
import type { LugarDisponible } from "@/lib/disponibilidad"
import { cobroPropuesto } from "@/lib/panel/libro-caja"
import { cotizarDia } from "@/lib/predio/cotizacion"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { EDAD_MAXIMA_MENOR, EDAD_MINIMA_CON_CARGO, pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

type Forma = "EFECTIVO" | "DEBITO" | "TRANSFERENCIA"
type Zona = "" | "parrilla" | "playa"

const campo = "mt-1 block h-11 w-full rounded-xl border bg-white px-3 text-base text-panel-ink"

function Error({ texto }: { texto?: string }) {
  return texto ? (
    <span role="alert" className="mt-1 block text-sm font-semibold text-[#a32020]">
      {texto}
    </span>
  ) : null
}

function Cantidad({ etiqueta, detalle, valor, minimo = 0, onChange }: { etiqueta: string; detalle: string; valor: number; minimo?: number; onChange: (valor: number) => void }) {
  return (
    <div className="rounded-2xl border border-panel-line bg-white px-3 py-2.5">
      <p className="font-semibold">{etiqueta}</p>
      <p className="text-xs text-panel-muted">{detalle}</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Restar ${etiqueta.toLowerCase()}`}
          disabled={valor <= minimo}
          onClick={() => onChange(valor - 1)}
          className="grid size-10 place-items-center rounded-full border border-panel-line hover:border-panel-muted disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="font-display w-8 text-center text-2xl tabular-nums" aria-live="polite">
          {valor}
        </span>
        <button
          type="button"
          aria-label={`Sumar ${etiqueta.toLowerCase()}`}
          onClick={() => onChange(valor + 1)}
          className="grid size-10 place-items-center rounded-full border border-panel-line hover:border-panel-muted"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/// Carga una reserva desde el panel. En Puerta es para quien llegó sin avisar: queda
/// para hoy y, en el mismo paso, se cobra y se marca el ingreso. En Reservas, para quien
/// reservó por teléfono, con la fecha que se elija.
export function NuevaReserva({ hoy, enPuerta, puedeCobrar }: { hoy: string; enPuerta: boolean; puedeCobrar: boolean }) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(hoy)
  const [grupo, setGrupo] = useState({ adultos: 1, menores: 0, sinCargo: 0 })
  const [zona, setZona] = useState<Zona>("")
  const [lugares, setLugares] = useState<LugarDisponible[]>([])
  const [unidadId, setUnidadId] = useState("")
  const [cobro, setCobro] = useState<Forma | "">(enPuerta && puedeCobrar ? "EFECTIVO" : "")
  const [ingresan, setIngresan] = useState(enPuerta)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pendiente, iniciar] = useTransition()

  const cotizacion = cotizarDia(grupo)
  const precio = (forma: Forma) => cobroPropuesto(cotizacion.total, [], forma).importe
  const borde = (nombre: string) => (errores[nombre] ? "border-[#c62828] ring-2 ring-[#c62828]/20" : "border-panel-line")

  useEffect(() => {
    if (!abierto || !zona) return
    const controlador = new AbortController()
    fetch(`/api/lugares?tipo=${zona}&desde=${fecha}&hasta=${fecha}`, { signal: controlador.signal })
      .then((respuesta) => respuesta.json())
      .then((json: { ok: boolean; lugares?: LugarDisponible[] }) => setLugares((json.lugares ?? []).filter((lugar) => lugar.estado === "libre")))
      .catch(() => undefined)
    return () => controlador.abort()
  }, [abierto, zona, fecha])

  if (!abierto) {
    return (
      <Button type="button" className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => setAbierto(true)}>
        <UserPlus className="size-4" aria-hidden />
        {enPuerta ? "Llegó alguien sin reserva" : "Nueva reserva"}
      </Button>
    )
  }

  const deHoy = fecha === hoy
  return (
    <form
      className="w-full rounded-3xl border-2 border-panel-ink/15 bg-white p-4 md:p-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        const datos = new FormData(evento.currentTarget)
        const texto = (clave: string) => String(datos.get(clave) ?? "").trim()
        const pedido = {
          fecha,
          nombre: texto("nombre"),
          apellido: texto("apellido"),
          dni: texto("dni").replace(/\D/g, ""),
          telefono: texto("telefono").replace(/\D/g, ""),
          ...grupo,
          unidadId: unidadId || undefined,
          notas: texto("notas") || undefined,
          cobro: cobro || undefined,
          ingresan: ingresan && deHoy,
        }
        const faltan: Record<string, string> = {}
        if (pedido.nombre.length < 2) faltan.nombre = "Escribí el nombre."
        if (pedido.apellido.length < 2) faltan.apellido = "Escribí el apellido."
        setErrores(faltan)
        if (Object.keys(faltan).length) {
          avisarRevisar("Revisá lo que está marcado en rojo.")
          return
        }
        iniciar(async () => {
          const resultado = await llamar(() => reservarEnElPredio(pedido))
          if (!resultado.ok) {
            avisarError(resultado.error)
            if (resultado.campos) setErrores(resultado.campos)
            return
          }
          avisarExito(
            [
              `Listo, quedó la reserva N.º ${resultado.id} de ${pedido.apellido}.`,
              pedido.cobro ? `Cobrados ${pesos(precio(pedido.cobro))}.` : "",
              pedido.ingresan ? "Ya figuran adentro." : "",
            ]
              .filter(Boolean)
              .join(" "),
          )
          setAbierto(false)
          setGrupo({ adultos: 1, menores: 0, sinCargo: 0 })
          setZona("")
          setUnidadId("")
          setErrores({})
        })
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">{enPuerta ? "Llegó sin reserva" : "Nueva reserva"}</h2>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <p className="text-sm text-panel-muted">
        {enPuerta ? "Queda como reserva de hoy, para que el cobro y el ingreso queden registrados." : "Para una visita del día: parrilla, playa o solo la entrada."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-panel-muted">
          Nombre
          <input name="nombre" autoComplete="off" className={cn(campo, borde("nombre"))} aria-invalid={Boolean(errores.nombre)} />
          <Error texto={errores.nombre} />
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          Apellido
          <input name="apellido" autoComplete="off" className={cn(campo, borde("apellido"))} aria-invalid={Boolean(errores.apellido)} />
          <Error texto={errores.apellido} />
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          DNI (opcional)
          <input name="dni" inputMode="numeric" className={cn(campo, borde("dni"))} />
          <Error texto={errores.dni} />
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          Celular (opcional)
          <input name="telefono" inputMode="numeric" placeholder="11 3009 1020" className={cn(campo, borde("telefono"))} />
          <Error texto={errores.telefono} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Cantidad etiqueta="Adultos" detalle={`Más de ${EDAD_MAXIMA_MENOR} años`} minimo={1} valor={grupo.adultos} onChange={(adultos) => setGrupo({ ...grupo, adultos })} />
        <Cantidad
          etiqueta="Menores"
          detalle={`De ${EDAD_MINIMA_CON_CARGO} a ${EDAD_MAXIMA_MENOR} años`}
          valor={grupo.menores}
          onChange={(menores) => setGrupo({ ...grupo, menores })}
        />
        <Cantidad etiqueta="Sin cargo" detalle={`Menores de ${EDAD_MINIMA_CON_CARGO} años`} valor={grupo.sinCargo} onChange={(sinCargo) => setGrupo({ ...grupo, sinCargo })} />
      </div>
      <Error texto={errores.adultos} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!enPuerta ? (
          <label className="text-sm font-semibold text-panel-muted">
            Día
            <input
              type="date"
              value={fecha}
              min={hoy}
              onChange={(evento) => {
                setFecha(evento.target.value || hoy)
                setUnidadId("")
              }}
              className={cn(campo, borde("fecha"))}
            />
          </label>
        ) : null}
        <label className="text-sm font-semibold text-panel-muted">
          Lugar
          <select
            value={zona}
            onChange={(evento) => {
              setZona(evento.target.value as Zona)
              setUnidadId("")
              setLugares([])
            }}
            className={cn(campo, "border-panel-line")}
          >
            <option value="">Sin lugar (solo la entrada)</option>
            <option value="parrilla">Parrilla o quincho</option>
            <option value="playa">Gazebo o palapa</option>
          </select>
        </label>
        {zona ? (
          <label className="text-sm font-semibold text-panel-muted">
            Cuál
            <select value={unidadId} onChange={(evento) => setUnidadId(evento.target.value)} className={cn(campo, "border-panel-line")}>
              <option value="">{lugares.length ? "Elegí uno libre" : "Buscando lugares libres…"}</option>
              {lugares.map((lugar) => (
                <option key={lugar.id} value={lugar.id}>
                  {nombreDeUnidad[lugar.tipo]} {lugar.etiqueta}
                  {lugar.capacidad ? ` · hasta ${lugar.capacidad}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={cn("text-sm font-semibold text-panel-muted", enPuerta ? "lg:col-span-2" : "")}>
          Notas (opcional)
          <input name="notas" maxLength={500} placeholder="Alergias, lo que haga falta saber" className={cn(campo, "border-panel-line")} />
        </label>
      </div>

      <div className="mt-4 rounded-2xl bg-panel px-4 py-3">
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-semibold">
            Total {pesos(cotizacion.total)} <span className="font-normal text-panel-muted">· en efectivo {pesos(precio("EFECTIVO"))}</span>
          </span>
          <span className="text-sm text-panel-muted">{cotizacion.lineas.map((linea) => linea.detalle).join(" · ")}</span>
        </p>
        {puedeCobrar ? (
          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">¿Cobrás ahora?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["EFECTIVO", `Efectivo ${pesos(precio("EFECTIVO"))}`],
                  ["DEBITO", `Débito ${pesos(precio("DEBITO"))}`],
                  ["TRANSFERENCIA", `Transferencia ${pesos(precio("TRANSFERENCIA"))}`],
                  ["", "Todavía no"],
                ] as const
              ).map(([valor, texto]) => (
                <label
                  key={valor || "no"}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold",
                    cobro === valor ? "border-panel-ink bg-white" : "border-panel-line bg-white/60 hover:border-panel-muted",
                  )}
                >
                  <input type="radio" name="cobro" checked={cobro === valor} onChange={() => setCobro(valor)} className="size-4 accent-[#3a2a18]" />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {enPuerta && deHoy ? (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={ingresan} onChange={(evento) => setIngresan(evento.target.checked)} className="size-5 accent-[#3a2a18]" />
            Ya ingresan al predio
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={pendiente} className="h-12 bg-panel-naranja px-6 text-base text-white hover:bg-panel-tostado">
          {pendiente ? "Guardando…" : enPuerta ? (cobro ? "Guardar, cobrar y dejar pasar" : "Guardar y dejar pasar") : "Guardar reserva"}
        </Button>
      </div>
    </form>
  )
}
