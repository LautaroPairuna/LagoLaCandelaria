"use client"

import { useState, useTransition } from "react"

import { cobrar, registrarAsistencia } from "@/app/panel/puerta/acciones"
import { AsistenciaDelGrupo, type Integrante } from "@/components/panel/asistencia-grupo"
import { Button } from "@/components/ui/button"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import { InsigniaDeEstado } from "@/components/panel/insignia-de-estado"
import type { Asistencia, Movimiento } from "@/lib/panel/asistencia"
import { cobroDelSaldo, type FormaDeCobro } from "@/lib/panel/cobros"
import type { EstadoVisible } from "@/lib/panel/estados"
import { pesos } from "@/lib/predio/tarifas"

const nombreDeForma: Record<FormaDeCobro, string> = {
  EFECTIVO: "efectivo",
  DEBITO: "débito",
  TRANSFERENCIA: "transferencia",
}

export function AccionesLlegada({
  id,
  titular,
  visible,
  asistencia,
  integrantes,
  ingreso,
  saldo,
}: {
  id: number
  titular: string
  visible: EstadoVisible
  asistencia: { porPersona: boolean; estado: Asistencia; adentro: number; salieron: number; total: number }
  integrantes: Integrante[]
  ingreso: { hora: string; por: string | null } | null
  saldo: number | null
}) {
  const [pendiente, iniciar] = useTransition()
  const [otroImporte, setOtroImporte] = useState(false)

  function mover(movimiento: Movimiento, exito: string) {
    iniciar(async () => void (await conAviso(() => registrarAsistencia({ reservaId: id, movimiento }), exito)))
  }

  function cobrarAhora(forma: FormaDeCobro, importe?: number) {
    const monto = importe ?? (saldo ? cobroDelSaldo(saldo, forma).importe : 0)
    if (!window.confirm(`¿Cobrar ${pesos(monto)} en ${nombreDeForma[forma]}?`)) return
    iniciar(async () => {
      const resultado = await conAviso(
        () => cobrar({ id, forma, importe }),
        (cobro) => `Listo, quedaron cobrados ${pesos(cobro.importe)} en ${nombreDeForma[forma]} a ${titular}.`,
      )
      if (resultado.ok) setOtroImporte(false)
    })
  }

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <InsigniaDeEstado estado={visible} grande />
        {asistencia.adentro + asistencia.salieron > 0 ? (
          <span className="text-panel-muted">
            {asistencia.adentro} de {asistencia.total} adentro
            {asistencia.salieron ? ` · ${asistencia.salieron} ya se ${asistencia.salieron === 1 ? "fue" : "fueron"}` : ""}
            {ingreso ? ` · primer ingreso ${ingreso.hora}${ingreso.por ? ` (${ingreso.por})` : ""}` : ""}
          </span>
        ) : null}
      </p>

      {asistencia.porPersona ? (
        <AsistenciaDelGrupo reservaId={id} integrantes={integrantes} puedeMarcar plegado />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {asistencia.estado === "por-llegar" || asistencia.estado === "no-vino" ? (
            <Button type="button" disabled={pendiente} className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => mover("ingreso", `Listo, ${titular} ya figura adentro.`)}>
              Marcar ingreso
            </Button>
          ) : null}
          {asistencia.estado === "adentro" ? (
            <Button type="button" variant="outline" disabled={pendiente} className="h-11 px-5" onClick={() => mover("salida", `Listo, ${titular} figura como que ya se fue.`)}>
              Marcar salida
            </Button>
          ) : null}
          {asistencia.estado === "adentro" || asistencia.estado === "finalizada" ? (
            <button type="button" disabled={pendiente} className="text-sm text-panel-muted underline-offset-4 hover:underline" onClick={() => mover("deshacer", "Listo, se deshizo el último paso.")}>
              Deshacer
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {saldo ? (
          <>
            <Button type="button" variant="outline" disabled={pendiente} className="h-10" onClick={() => cobrarAhora("EFECTIVO")}>
              Efectivo {pesos(cobroDelSaldo(saldo, "EFECTIVO").importe)}
            </Button>
            <Button type="button" variant="outline" disabled={pendiente} className="h-10" onClick={() => cobrarAhora("DEBITO")}>
              Débito {pesos(saldo)}
            </Button>
            <Button type="button" variant="outline" disabled={pendiente} className="h-10" onClick={() => cobrarAhora("TRANSFERENCIA")}>
              Transferencia
            </Button>
          </>
        ) : null}
        <button
          type="button"
          className="text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline"
          onClick={() => setOtroImporte((actual) => !actual)}
        >
          {otroImporte ? "Cerrar" : "Otro importe"}
        </button>
      </div>

      {otroImporte ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(evento) => {
            evento.preventDefault()
            const datos = new FormData(evento.currentTarget)
            const importe = Number(String(datos.get("importe")).replace(/\D/g, ""))
            if (!importe) {
              avisarRevisar("Escribí cuánto vas a cobrar, en pesos y sin puntos.")
              return
            }
            cobrarAhora(datos.get("forma") as FormaDeCobro, importe)
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Importe</span>
            <input name="importe" inputMode="numeric" className="h-10 w-36 rounded-lg border border-panel-line bg-white px-3" placeholder="40000" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Forma</span>
            <select name="forma" className="h-10 rounded-lg border border-panel-line bg-white px-3">
              <option value="EFECTIVO">Efectivo</option>
              <option value="DEBITO">Débito</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </label>
          <Button type="submit" disabled={pendiente} className="h-10 bg-panel-naranja text-white hover:bg-panel-tostado">
            Cobrar
          </Button>
        </form>
      ) : null}
    </div>
  )
}
