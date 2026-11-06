import { ClipboardList, MessageCircle, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesLlegada } from "@/components/panel/acciones-llegada"
import { AccionesMasivas, type EnvioDeTicket } from "@/components/panel/acciones-masivas"
import { CambiarEstado } from "@/components/panel/cambiar-estado"
import { EncabezadoDelDia } from "@/components/panel/encabezado-del-dia"
import { FilaDesplegable } from "@/components/panel/fila-desplegable"
import { FiltrosDePuerta } from "@/components/panel/filtros-puerta"
import { InsigniaDeEstado, LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { NuevaReserva } from "@/components/panel/nueva-reserva"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { feriadosDelAnio } from "@/lib/disponibilidad"
import { buscarReservas, type FilaDeBusqueda } from "@/lib/panel/busqueda"
import { estilosDeEstado } from "@/lib/panel/estados"
import { filtrarYOrdenar, leerFiltros } from "@/lib/panel/filtros-puerta"
import { rangoConMesPanel } from "@/lib/panel/formato"
import { mensajeDeConfirmada } from "@/lib/panel/mensajes"
import { llegadasDelDia, type Llegada } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Puerta" }

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"
const botonSecundario = "inline-flex h-11 items-center gap-2 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted"

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  const sesion = await exigirPanel("puerta")
  const params = await searchParams
  const busqueda = (Array.isArray(params.q) ? params.q[0] : params.q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const filtros = leerFiltros(params)
  // Con algo escrito, la búsqueda es en todas las fechas (como era el panel Reservas).
  const [delDia, resultados] = await Promise.all([
    busqueda ? Promise.resolve([]) : llegadasDelDia(fecha),
    busqueda ? buscarReservas({ texto: busqueda, estado: "activas", pasadas: true, hoy }, 100) : null,
  ])
  const llegadas = filtrarYOrdenar(delDia, filtros)
  const puedeConfirmar = puedeVer(sesion.user.role, "reservas")
  const feriados = await feriadosDelAnio(hoy)

  const aConfirmar = llegadas.filter((item) => item.visible === "a-confirmar").map((item) => item.id)
  const envios: EnvioDeTicket[] = llegadas
    .filter((item) => item.visible === "confirmada")
    .map((item) => {
      const telefono = normalizarTelefono(item.telefono ?? "")
      const mensaje = mensajeDeConfirmada({ nombre: item.nombre, codigo: item.codigo, desde: item.desde, token: item.token, modulo: item.modulo })
      return {
        id: item.id,
        titular: item.titular,
        telefono: item.telefono ?? "",
        whatsapp: telefono ? `https://wa.me/${telefono.whatsapp}?text=${encodeURIComponent(mensaje)}` : null,
        enviado: Boolean(item.ticketEnviadoEn),
      }
    })

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDelDia fecha={fecha} hoy={hoy} ruta="/panel/puerta" kicker="Ingreso y cobranza" />
      <PestanasDePuerta activa="reservas" fecha={momento === "hoy" ? undefined : fecha} />


      <div className="mt-6 space-y-4">
        <form className="relative" role="search">
          {momento !== "hoy" ? <input type="hidden" name="fecha" value={fecha} /> : null}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar en todas las fechas: N.º, código, apellido, institución, DNI o teléfono"
            aria-label="Buscar reserva en todas las fechas"
            className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {momento === "hoy" ? <NuevaReserva hoy={hoy} enPuerta puedeCobrar feriados={feriados} /> : null}
          {puedeConfirmar ? <NuevaReserva hoy={hoy} enPuerta={false} puedeCobrar feriados={feriados} /> : null}
          {puedeConfirmar ? (
            <Link href="/panel/reservas/confirmaciones" className={botonSecundario}>
              <MessageCircle className="size-4 text-[#25a95a]" aria-hidden />
              Confirmar las de mañana
            </Link>
          ) : null}
          <Link href={`/panel/reservas/planilla?fecha=${fecha}`} className={botonSecundario}>
            <ClipboardList className="size-4 text-panel-tostado" aria-hidden />
            Planilla del día
          </Link>
          {momento !== "pasado" && !busqueda ? <AccionesMasivas aConfirmar={aConfirmar} envios={envios} puedeConfirmar={puedeConfirmar} /> : null}
        </div>
        {busqueda ? null : <FiltrosDePuerta filtros={filtros} />}
        <LeyendaDeEstados />
      </div>

      {resultados ? <ResultadosDeBusqueda resultados={resultados} busqueda={busqueda} puedeCambiar={puedeConfirmar} /> : null}

      {resultados ? null : (
        <section aria-labelledby="reservas-del-dia" className="mt-6">
          <h2 id="reservas-del-dia" className="font-display flex items-center gap-3 text-2xl tracking-tight">
            Reservas del día
            <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{llegadas.length}</span>
          </h2>
          {llegadas.length === 0 ? (
            <p className="mt-2 text-sm text-panel-muted">{llegadas.length !== delDia.length ? "Ninguna reserva coincide con los filtros." : "No hay reservas para ese día."}</p>
          ) : (
            <>
              <div className={cn("mt-3 hidden overflow-hidden rounded-3xl bg-white lg:block", sombra)}>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
                    <tr>
                      <th className="px-5 py-3 font-bold">Reserva</th>
                      <th className="px-3 py-3 font-bold">Quién</th>
                      <th className="px-3 py-3 font-bold">Lugar</th>
                      <th className="px-3 py-3 font-bold">Horario</th>
                      <th className="px-3 py-3 font-bold">Estado</th>
                      <th className="px-3 py-3 text-right font-bold">Saldo</th>
                      <th className="px-4 py-3">
                        <span className="sr-only">Ingreso y cobro</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel-line">
                    {llegadas.map((llegada) => (
                      <FilaDesplegable
                        key={llegada.id}
                        columnas={7}
                        etiqueta={llegada.titular}
                        clase={cn("border-l-8", estilosDeEstado[llegada.visible].tarjeta, estilosDeEstado[llegada.visible].borde)}
                        celdas={
                          <>
                            <td className="px-5 py-3">
                              <span className="font-semibold tabular-nums">{llegada.codigo}</span>
                              <span className="block text-xs text-panel-muted">{nombreDelModulo[llegada.modulo]}</span>
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/panel/reservas/${llegada.id}`} className="font-semibold hover:underline">
                                {llegada.titular}
                              </Link>
                              <span className="block text-xs text-panel-muted">
                                {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"}
                                {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
                              </span>
                            </td>
                            <td className="max-w-48 px-3 py-3">{llegada.lugares.join(", ") || <span className="text-panel-muted">—</span>}</td>
                            <td className="px-3 py-3 whitespace-nowrap tabular-nums">{llegada.horario}</td>
                            <td className="px-3 py-3">
                              <Estado llegada={llegada} puedeCambiar={puedeConfirmar} />
                            </td>
                            <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                              <Saldo llegada={llegada} />
                            </td>
                          </>
                        }
                        detalle={<Acciones llegada={llegada} bloqueado={momento === "futuro"} />}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="mt-3 space-y-3 lg:hidden">
                {llegadas.map((llegada) => (
                  <li key={llegada.id} className={cn("grid gap-4 rounded-3xl border-2 border-l-8 p-4", sombra, estilosDeEstado[llegada.visible].tarjeta, estilosDeEstado[llegada.visible].borde)}>
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">
                        {nombreDelModulo[llegada.modulo]} · {llegada.codigo}
                      </p>
                      <Link href={`/panel/reservas/${llegada.id}`} className="font-display mt-1 block text-2xl tracking-tight hover:underline">
                        {llegada.titular}
                      </Link>
                      <p className="mt-1 text-base text-panel-ink/80">
                        {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"} · {llegada.horario}
                        {llegada.lugares.length ? ` · ${llegada.lugares.join(", ")}` : ""}
                        {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Estado llegada={llegada} puedeCambiar={puedeConfirmar} />
                        <span className="text-base font-semibold">
                          <Saldo llegada={llegada} />
                        </span>
                      </div>
                    </div>
                    <Acciones llegada={llegada} bloqueado={momento === "futuro"} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  )
}

/// Antes de que llegue alguien, el estado se cambia desde la lista; después, se muestra.
function Estado({ llegada, puedeCambiar }: { llegada: Llegada; puedeCambiar: boolean }) {
  if (puedeCambiar && (llegada.visible === "a-confirmar" || llegada.visible === "confirmada")) {
    return <CambiarEstado id={llegada.id} codigo={llegada.codigo} titular={llegada.titular} estado={llegada.visible === "a-confirmar" ? "PENDIENTE" : "CONFIRMADA"} />
  }
  return <InsigniaDeEstado estado={llegada.visible} />
}

function Saldo({ llegada }: { llegada: Llegada }) {
  if (llegada.consumo) return <span className="text-panel-muted">Consumo aparte</span>
  if (llegada.aConfirmar) return <span className="text-panel-muted">A presupuestar</span>
  if (!llegada.saldo) return <span className="text-[#3f6b12]">Pagado</span>
  return <>Saldo {pesos(llegada.saldo)}</>
}

function Acciones({ llegada, bloqueado }: { llegada: Llegada; bloqueado: boolean }) {
  return (
    <AccionesLlegada
      id={llegada.id}
      titular={llegada.titular}
      visible={llegada.visible}
      ingreso={llegada.ingresoEn ? { hora: hora.format(llegada.ingresoEn), por: llegada.ingresoPor } : null}
      asistencia={{ porPersona: llegada.porPersona, estado: llegada.asistencia, adentro: llegada.adentro, salieron: llegada.salieron, total: llegada.total }}
      integrantes={llegada.integrantes}
      saldo={llegada.saldo}
      efectivo={llegada.efectivo}
      soloCobro={bloqueado}
    />
  )
}

function ResultadosDeBusqueda({ resultados, busqueda, puedeCambiar }: { resultados: { total: number; filas: FilaDeBusqueda[] }; busqueda: string; puedeCambiar: boolean }) {
  return (
    <section aria-labelledby="resultados" className="mt-6">
      <h2 id="resultados" className="font-display flex flex-wrap items-center gap-3 text-2xl tracking-tight">
        Resultados en todas las fechas
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{resultados.total}</span>
        <Link href="/panel/puerta" className="font-sans text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
          Volver al día
        </Link>
      </h2>
      {resultados.filas.length === 0 ? (
        <p className="mt-2 text-sm text-panel-muted">No encontramos reservas con «{busqueda}». Probá con menos palabras o solo el apellido.</p>
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {resultados.filas.map((fila) => (
            <li key={fila.id} className={cn("rounded-2xl border-2 border-l-8 p-4", sombra, estilosDeEstado[fila.visible].tarjeta, estilosDeEstado[fila.visible].borde)}>
              <p className="text-xs font-bold tracking-wide text-panel-muted uppercase">
                {nombreDelModulo[fila.modulo]} · {fila.codigo}
              </p>
              <Link href={`/panel/reservas/${fila.id}`} className="font-display mt-1 block text-xl tracking-tight hover:underline">
                {fila.titular}
              </Link>
              <p className="text-sm text-panel-muted">
                {rangoConMesPanel(fila.desde, fila.hasta)} · {fila.personas} pers.{fila.lugares.length ? ` · ${fila.lugares.join(", ")}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {puedeCambiar && (fila.visible === "a-confirmar" || fila.visible === "confirmada") ? (
                  <CambiarEstado id={fila.id} codigo={fila.codigo} titular={fila.titular} estado={fila.visible === "a-confirmar" ? "PENDIENTE" : "CONFIRMADA"} />
                ) : (
                  <InsigniaDeEstado estado={fila.visible} />
                )}
                <Link href={`/panel/puerta?fecha=${fila.desde}`} className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline">
                  Ver ese día
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
