import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccionesLlegada } from "@/components/panel/acciones-llegada"
import { AccionesMasivas, type EnvioDeTicket } from "@/components/panel/acciones-masivas"
import { CambiarEstado } from "@/components/panel/cambiar-estado"
import { FilaDesplegable } from "@/components/panel/fila-desplegable"
import { FiltrosDePuerta } from "@/components/panel/filtros-puerta"
import { InsigniaDeEstado, LeyendaDeEstados } from "@/components/panel/insignia-de-estado"
import { NuevaReserva } from "@/components/panel/nueva-reserva"
import { PestanasDePuerta } from "@/components/panel/pestanas-puerta"
import { feriadosDelAnio } from "@/lib/disponibilidad"
import { totalesPorForma } from "@/lib/panel/cobros"
import { estilosDeEstado } from "@/lib/panel/estados"
import { filtrarYOrdenar, leerFiltros } from "@/lib/panel/filtros-puerta"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { mensajeDeConfirmada } from "@/lib/panel/mensajes"
import { llegadasDelDia, pagosDelDia, type Llegada } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { puedeVer } from "@/lib/panel/roles"
import { exigirPanel } from "@/lib/panel/sesion"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { cn } from "cn"

export const metadata: Metadata = { title: "Puerta" }

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

export default async function PanelPuerta({ searchParams }: PageProps<"/panel/puerta">) {
  const sesion = await exigirPanel("puerta")
  const params = await searchParams
  const busqueda = (Array.isArray(params.q) ? params.q[0] : params.q)?.slice(0, 60) ?? ""
  const hoy = hoyEnElPredio()
  const fechaPedida = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha
  const fecha = fechaPedida && esFechaIso(fechaPedida) ? fechaPedida : hoy
  const momento = fecha < hoy ? "pasado" : fecha > hoy ? "futuro" : "hoy"
  const filtros = leerFiltros(params)
  const [encontradas, todas, pagos] = await Promise.all([llegadasDelDia(fecha, busqueda), llegadasDelDia(fecha), pagosDelDia(fecha)])
  const llegadas = filtrarYOrdenar(encontradas, filtros)
  const puedeConfirmar = puedeVer(sesion.user.role, "reservas")
  const enlace = (dia: string) => (dia === hoy ? "/panel/puerta" : `/panel/puerta?fecha=${dia}`)

  const esperadas = todas.reduce((suma, item) => suma + item.personas, 0)
  const adentro = todas.reduce((suma, item) => suma + item.adentro, 0)
  const vinieron = todas.reduce((suma, item) => suma + item.adentro + item.salieron, 0)
  const caja = totalesPorForma(pagos)
  const cobrado = caja.EFECTIVO + caja.DEBITO + caja.TRANSFERENCIA

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
      <header>
        <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
          <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">Ingreso y cobranza</p>
          {momento !== "hoy" ? (
            <Link href="/panel/puerta" className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
              Hoy
            </Link>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-2 md:mt-2 md:gap-x-2">
          <Link href={enlace(sumarDiasIso(fecha, -1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día anterior">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="font-display min-w-0 text-center text-2xl leading-tight tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
          <Link href={enlace(sumarDiasIso(fecha, 1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día siguiente">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <form action="/panel/puerta" className="flex items-center gap-2 md:ml-3">
            <input type="date" name="fecha" defaultValue={fecha} aria-label="Elegir otro día" className="h-10 rounded-xl border border-panel-line bg-white px-3 text-sm" />
            <button type="submit" className="h-10 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:border-panel-muted">
              Ir
            </button>
          </form>
        </div>
      </header>
      <PestanasDePuerta activa="reservas" fecha={momento === "hoy" ? undefined : fecha} />

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { termino: "Grupos", valor: String(todas.length) },
          { termino: "Personas esperadas", valor: String(esperadas) },
          momento === "pasado"
            ? { termino: "Vinieron", valor: `${vinieron} de ${esperadas}` }
            : { termino: "Adentro ahora", valor: `${adentro} de ${esperadas}` },
          { termino: momento === "hoy" ? "Cobrado hoy" : "Cobrado ese día", valor: pesos(cobrado), href: `/panel/puerta/caja?desde=${fecha}&hasta=${fecha}` },
        ].map((dato) => (
          <div key={dato.termino} className={cn("rounded-2xl bg-white px-4 py-3", sombra)}>
            <dt className="text-xs font-bold tracking-wide text-panel-muted uppercase">{dato.termino}</dt>
            <dd className="font-display mt-1 text-2xl tracking-tight md:text-3xl">
              {"href" in dato && dato.href ? (
                <Link href={dato.href} className="hover:underline">
                  {dato.valor}
                </Link>
              ) : (
                dato.valor
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-4">
        <form className="relative" role="search">
          {momento !== "hoy" ? <input type="hidden" name="fecha" value={fecha} /> : null}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="N.º de reserva, apellido, institución o DNI"
            aria-label="Buscar reserva"
            className="h-12 w-full rounded-2xl border border-panel-line bg-white pr-4 pl-11"
          />
        </form>
        <FiltrosDePuerta filtros={filtros} />
        <div className="flex flex-wrap items-center gap-3">
          {momento === "hoy" ? <NuevaReserva hoy={hoy} enPuerta puedeCobrar feriados={await feriadosDelAnio(hoy)} /> : null}
          {momento !== "pasado" ? <AccionesMasivas aConfirmar={aConfirmar} envios={envios} puedeConfirmar={puedeConfirmar} /> : null}
        </div>
        <LeyendaDeEstados />
      </div>

      <section aria-labelledby="reservas-del-dia" className="mt-6">
        <h2 id="reservas-del-dia" className="font-display flex items-center gap-3 text-2xl tracking-tight">
          Reservas del día
          <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-bold text-panel-muted">{llegadas.length}</span>
        </h2>
        {llegadas.length === 0 ? (
          <p className="mt-2 text-sm text-panel-muted">{busqueda || llegadas.length !== encontradas.length ? "Nadie coincide con la búsqueda o los filtros." : "No hay reservas para ese día."}</p>
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
