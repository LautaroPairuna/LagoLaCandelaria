import { MessageCircleCheck } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { EstadoEditable } from "@/components/panel/estado-editable"
import { FichaDeLlegada, type DatosDeLlegada } from "@/components/panel/ficha-de-llegada"
import { estilosDeEstado } from "@/lib/panel/estados"
import { rangoConMesPanel } from "@/lib/panel/formato"
import type { Llegada } from "@/lib/panel/puerta"
import { nombreDelModulo } from "@/lib/panel/reservas"
import { pesos } from "@/lib/predio/tarifas"
import { reglamentoDe } from "@/lib/reglamentos"
import { cn } from "cn"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })
const sombra = "shadow-[0_8px_28px_rgba(58,42,24,0.06)]"

/// Una columna más, propia de la pantalla (por ejemplo, la respuesta de la confirmación).
export type ColumnaExtra = { titulo: string; celda: (llegada: Llegada) => ReactNode }

/// La planilla de reservas: la misma en Puerta, Ocupación, la búsqueda y las
/// confirmaciones. Tabla en la computadora y tarjetas en el celular; el estado se cambia
/// tocando la etiqueta y "Abrir" despliega la ficha con ingreso, cobro y modificaciones.
/// El menú del estado y la ficha se dibujan fijos en la pantalla: el recorte de las
/// esquinas redondeadas de la tabla no los tapa.
export function TablaDeReservas({
  llegadas,
  hoy,
  puedeConfirmar,
  conFecha = false,
  extra,
}: {
  llegadas: Llegada[]
  hoy: string
  puedeConfirmar: boolean
  /// En listas de varios días (la búsqueda) se muestra el día además del horario.
  conFecha?: boolean
  extra?: ColumnaExtra
}) {
  return (
    <>
      <div className={cn("mt-3 hidden overflow-hidden rounded-3xl bg-white lg:block", sombra)}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-panel-line text-xs font-bold tracking-wide text-panel-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Reserva</th>
              <th className="px-3 py-3 font-bold">Quién</th>
              <th className="px-3 py-3 font-bold">Lugar</th>
              <th className="px-3 py-3 font-bold">{conFecha ? "Cuándo" : "Horario"}</th>
              <th className="px-3 py-3 font-bold">Estado</th>
              {extra ? <th className="px-3 py-3 font-bold">{extra.titulo}</th> : null}
              <th className="px-3 py-3 text-right font-bold">Saldo</th>
              <th className="px-4 py-3">
                <span className="sr-only">Ficha</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-line">
            {llegadas.map((llegada) => (
              <tr key={llegada.id} className={cn("border-l-8", estilosDeEstado[llegada.visible].tarjeta, estilosDeEstado[llegada.visible].borde)}>
                <td className="px-4 py-3">
                  <span className="font-semibold whitespace-nowrap tabular-nums">{llegada.codigo}</span>
                  <span className="block text-xs text-panel-muted">{nombreDelModulo[llegada.modulo]}</span>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/panel/reservas/${llegada.id}`} className="font-semibold hover:underline">
                    {llegada.titular}
                  </Link>
                  <TildeDeWhatsapp contacto={llegada.contacto} />
                  <span className="block text-xs text-panel-muted">
                    {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"}
                    {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
                  </span>
                  {llegada.visible === "parcial" ? (
                    <span className="block text-xs font-semibold text-panel-tostado">
                      {llegada.adentro} adentro · faltan {llegada.pendientes}
                    </span>
                  ) : null}
                </td>
                <td className="max-w-48 px-3 py-3">{llegada.lugares.join(", ") || <span className="text-panel-muted">—</span>}</td>
                <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                  {conFecha ? (
                    <>
                      {rangoConMesPanel(llegada.desde, llegada.hasta)}
                      <span className="block text-xs text-panel-muted">{llegada.horario}</span>
                    </>
                  ) : (
                    llegada.horario
                  )}
                </td>
                <td className="px-3 py-3">
                  <Estado llegada={llegada} hoy={hoy} puedeConfirmar={puedeConfirmar} />
                </td>
                {extra ? <td className="px-3 py-3">{extra.celda(llegada)}</td> : null}
                <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                  <Saldo llegada={llegada} />
                </td>
                <td className="px-4 py-3 text-right">
                  <FichaDeLlegada llegada={datosDeLlegada(llegada, hoy)} hoy={hoy} puedeConfirmar={puedeConfirmar} />
                </td>
              </tr>
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
              <Link href={`/panel/reservas/${llegada.id}`} className="font-display mt-1 inline-block text-2xl tracking-tight hover:underline">
                {llegada.titular}
              </Link>
              <TildeDeWhatsapp contacto={llegada.contacto} />
              <p className="mt-1 text-base text-panel-ink/80">
                {llegada.personas} {llegada.personas === 1 ? "persona" : "personas"} · {conFecha ? `${rangoConMesPanel(llegada.desde, llegada.hasta)}, ` : ""}
                {llegada.horario}
                {llegada.lugares.length ? ` · ${llegada.lugares.join(", ")}` : ""}
                {llegada.dni ? ` · DNI ${llegada.dni}` : ""}
              </p>
              {extra ? <div className="mt-3">{extra.celda(llegada)}</div> : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Estado llegada={llegada} hoy={hoy} puedeConfirmar={puedeConfirmar} />
                <span className="text-base font-semibold">
                  <Saldo llegada={llegada} />
                </span>
                <span className="ml-auto">
                  <FichaDeLlegada llegada={datosDeLlegada(llegada, hoy)} hoy={hoy} puedeConfirmar={puedeConfirmar} />
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

/// La etiqueta del estado se toca para cambiarlo; el ingreso y la salida los marca Puerta
/// (y quien tiene reservas, que también ve Puerta).
function Estado({ llegada, hoy, puedeConfirmar }: { llegada: Llegada; hoy: string; puedeConfirmar: boolean }) {
  return (
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
  )
}

function datosDeLlegada(llegada: Llegada, hoy: string): DatosDeLlegada {
  return {
    id: llegada.id,
    codigo: llegada.codigo,
    token: llegada.token,
    titular: llegada.titular,
    propuesta: nombreDelModulo[llegada.modulo],
    modificable: Boolean(reglamentoDe(llegada.modulo)) && !llegada.ingresoEn && llegada.desde >= hoy,
    horario: llegada.horario,
    lugares: llegada.lugares,
    personas: llegada.personas,
    dni: llegada.dni,
    telefono: llegada.telefono,
    desde: llegada.desde,
    hasta: llegada.hasta,
    visible: llegada.visible,
    asistencia: { porPersona: llegada.porPersona, estado: llegada.asistencia, adentro: llegada.adentro, salieron: llegada.salieron, total: llegada.total, cantidades: llegada.cantidades },
    integrantes: llegada.integrantes,
    ingreso: llegada.ingresoEn ? { hora: hora.format(llegada.ingresoEn), por: llegada.ingresoPor } : null,
    saldo: llegada.saldo,
    cobrado: llegada.cobrado,
    importeTotal: llegada.importeTotal,
    efectivo: llegada.efectivo,
    aConfirmar: llegada.aConfirmar,
    consumo: llegada.consumo,
  }
}

function Saldo({ llegada }: { llegada: Llegada }) {
  if (llegada.consumo) return <span className="text-panel-muted">Consumo aparte</span>
  if (llegada.aConfirmar) return <span className="text-panel-muted">A presupuestar</span>
  if (!llegada.saldo) return <span className="text-[#3f6b12]">Pagado</span>
  return (
    <>
      Saldo {pesos(llegada.saldo)}
      {llegada.cobrado ? <span className="block text-xs font-normal text-panel-muted">Cobrado {pesos(llegada.cobrado)}</span> : null}
    </>
  )
}

const nombreDeContacto: Record<string, string> = { confirmacion: "pedido de confirmación", ticket: "ticket", libre: "mensaje", confirmo: "confirmó su presencia" }
const cuando = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

/// El tilde verde de WhatsApp: ya se le escribió desde el panel. Al pasar el mouse dice
/// qué se mandó, cuándo y quién.
function TildeDeWhatsapp({ contacto }: { contacto: Llegada["contacto"] }) {
  if (!contacto) return null
  const texto = `${contacto.tipo === "confirmo" ? "Contactado por WhatsApp" : "WhatsApp enviado"}: ${nombreDeContacto[contacto.tipo] ?? contacto.tipo}, ${cuando.format(contacto.en)}${contacto.por ? `, por ${contacto.por}` : ""}`
  return (
    <span title={texto} className="ml-1.5 inline-grid size-5 place-items-center rounded-full bg-[#25d366] align-[-0.2em] text-white">
      <MessageCircleCheck className="size-3.5" aria-hidden />
      <span className="sr-only">{texto}</span>
    </span>
  )
}
