"use client"

import { Minus, Plus, UserPlus, X } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

import { lugaresLibresDelPanel, reservarEnElPredio } from "@/app/panel/reservas/alta"
import { Button } from "@/components/ui/button"
import { avisarError, avisarExito, avisarRevisar, llamar } from "@/lib/avisos"
import type { LugarDisponible } from "@/lib/disponibilidad"
import { cobroPropuesto } from "@/lib/panel/libro-caja"
import { mapaDeEspeciales, tipoDeDia } from "@/lib/predio/calendario"
import { lugaresDePlayaPara } from "@/lib/predio/asignacion"
import { cotizarDia } from "@/lib/predio/cotizacion"
import { parrillasOfrecidas, personasQueOcupan, revisarEleccionDelPanel, sugerir } from "@/lib/predio/eleccion"
import { MAX_PERSONAS_PARRILLA, type UnidadPredio } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { EDAD_MAXIMA_MENOR, EDAD_MINIMA_CON_CARGO, pesos, type Precios } from "@/lib/predio/tarifas"
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

/// Carga una reserva desde el panel: quien llegó sin avisar o quien reservó por teléfono.
/// Para hoy se puede cobrar y marcar el ingreso en el mismo paso. Los lugares siguen las
/// reglas de la web: la parrilla del tamaño que alcanza (o un quincho) y un gazebo o una
/// palapa cada 4 personas.
export function NuevaReserva({ hoy, puedeCobrar, puedeMarcarIngreso, feriados, precios }: { hoy: string; puedeCobrar: boolean; puedeMarcarIngreso: boolean; feriados: string[]; precios: Precios }) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(hoy)
  const [grupo, setGrupo] = useState({ adultos: 1, menores: 0, sinCargo: 0 })
  const [zona, setZona] = useState<Zona>("")
  const [lugares, setLugares] = useState<LugarDisponible[]>([])
  const [unidadIds, setUnidadIds] = useState<string[]>([])
  const [cobro, setCobro] = useState<Forma | "">("")
  const [ingresan, setIngresan] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pendiente, iniciar] = useTransition()

  const cotizacion = cotizarDia(grupo, tipoDeDia(fecha, mapaDeEspeciales(feriados.map((dia) => ({ fecha: dia, tipo: "FERIADO" as const, motivo: "" })))), precios)
  const precio = (forma: Forma) => cobroPropuesto(cotizacion.total, [], forma).importe
  const borde = (nombre: string) => (errores[nombre] ? "border-[#c62828] ring-2 ring-[#c62828]/20" : "border-panel-line")

  useEffect(() => {
    if (!abierto || !zona) return
    let vigente = true
    void llamar(() => lugaresLibresDelPanel({ zona, fecha })).then((resultado) => {
      if (vigente && resultado.ok) setLugares(resultado.lugares)
    })
    return () => {
      vigente = false
    }
  }, [abierto, zona, fecha])

  if (!abierto) {
    return (
      <Button type="button" className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => setAbierto(true)}>
        <UserPlus className="size-4" aria-hidden />
        Nueva reserva
      </Button>
    )
  }

  const deHoy = fecha === hoy
  const personas = personasQueOcupan(grupo)
  const ofrecidos: UnidadPredio[] = zona === "parrilla" ? [...lugares.filter((lugar) => lugar.tipo === "QUINCHO"), ...parrillasOfrecidas(personas, lugares)] : lugares
  const elegidos = unidadIds.flatMap((id) => lugares.filter((lugar) => lugar.id === id))
  const revision = zona && elegidos.length ? revisarEleccionDelPanel(zona, personas, elegidos) : null
  const cuantos = zona === "playa" ? lugaresDePlayaPara(personas) : 1
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
          zona: zona || undefined,
          unidadIds: unidadIds.length ? unidadIds : undefined,
          notas: texto("notas") || undefined,
          cobro: cobro || undefined,
          ingresan: ingresan && deHoy,
        }
        const faltan: Record<string, string> = {}
        if (pedido.nombre.length < 2) faltan.nombre = "Escribí el nombre."
        if (pedido.apellido.length < 2) faltan.apellido = "Escribí el apellido."
        if (revision && !revision.ok) faltan.lugar = revision.mensaje
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
          setUnidadIds([])
          setErrores({})
        })
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">Nueva reserva</h2>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-panel">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <p className="text-sm text-panel-muted">
        Para una visita del día: parrilla, playa o solo la entrada. Si es para hoy, se puede cobrar y marcar el ingreso en el mismo paso.
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
        <label className="text-sm font-semibold text-panel-muted">
          Día
          <input
            type="date"
            value={fecha}
            min={hoy}
            onChange={(evento) => {
              setFecha(evento.target.value || hoy)
              setUnidadIds([])
            }}
            className={cn(campo, borde("fecha"))}
          />
        </label>
        <label className="text-sm font-semibold text-panel-muted">
          Lugar
          <select
            value={zona}
            onChange={(evento) => {
              setZona(evento.target.value as Zona)
              setUnidadIds([])
              setLugares([])
            }}
            className={cn(campo, "border-panel-line")}
          >
            <option value="">Sin lugar (solo la entrada)</option>
            <option value="parrilla">Parrilla o quincho</option>
            <option value="playa">Gazebo o palapa</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-panel-muted lg:col-span-2">
          Notas (opcional)
          <input name="notas" maxLength={500} placeholder="Alergias, lo que haga falta saber" className={cn(campo, "border-panel-line")} />
        </label>
      </div>

      {zona ? (
        <fieldset className="mt-3 rounded-2xl border border-panel-line p-3">
          <legend className="px-1 text-sm font-semibold text-panel-muted">
            {zona === "parrilla"
              ? `${personas > MAX_PERSONAS_PARRILLA ? "Son más de 18: va un quincho" : `Una parrilla para ${personas} (o un quincho)`}`
              : `Para ${personas} ${personas === 1 ? "persona" : "personas"} ${cuantos === 1 ? "va 1 lugar" : `van ${cuantos} lugares`} (4 por gazebo o palapa)`}
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            {ofrecidos.length === 0 ? <p className="text-sm text-panel-muted">{lugares.length ? "No hay lugares libres de ese tamaño." : "Buscando lugares libres…"}</p> : null}
            {ofrecidos.map((lugar) => {
              const elegido = unidadIds.includes(lugar.id)
              return (
                <button
                  key={lugar.id}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() =>
                    setUnidadIds(elegido ? unidadIds.filter((id) => id !== lugar.id) : zona === "parrilla" ? [lugar.id] : [...unidadIds, lugar.id])
                  }
                  className={cn(
                    "rounded-full border-2 px-3 py-1.5 text-sm font-semibold",
                    elegido ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
                  )}
                >
                  {nombreDeUnidad[lugar.tipo]} {lugar.etiqueta}
                  {lugar.capacidad && lugar.tipo !== "GAZEBO" && lugar.tipo !== "PALAPA" ? <span className="font-normal opacity-75"> · {lugar.capacidad}</span> : null}
                </button>
              )
            })}
            {ofrecidos.length ? (
              <button
                type="button"
                onClick={() => setUnidadIds((sugerir(zona, personas, ofrecidos) ?? []).map((lugar) => lugar.id))}
                className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline"
              >
                Elegir por mí
              </button>
            ) : null}
          </div>
          {revision && !revision.ok ? <p className="mt-2 text-sm font-semibold text-[#a32020]">{revision.mensaje}</p> : null}
          <Error texto={errores.lugar} />
        </fieldset>
      ) : null}

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
        {puedeMarcarIngreso && deHoy ? (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={ingresan} onChange={(evento) => setIngresan(evento.target.checked)} className="size-5 accent-[#3a2a18]" />
            Ya ingresan al predio
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={pendiente} className="h-12 bg-panel-naranja px-6 text-base text-white hover:bg-panel-tostado">
          {pendiente ? "Guardando…" : ingresan && deHoy ? (cobro ? "Guardar, cobrar y dejar pasar" : "Guardar y dejar pasar") : cobro ? "Guardar y cobrar" : "Guardar reserva"}
        </Button>
      </div>
    </form>
  )
}
