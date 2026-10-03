"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { cobrar, deshacerIngreso, marcarIngreso } from "@/app/panel/puerta/acciones"
import { Button } from "@/components/ui/button"
import { cobroDelSaldo, type FormaDeCobro } from "@/lib/panel/cobros"
import { pesos } from "@/lib/predio/tarifas"

const nombreDeForma: Record<FormaDeCobro, string> = {
  EFECTIVO: "efectivo",
  DEBITO: "débito",
  TRANSFERENCIA: "transferencia",
}

export function AccionesLlegada({
  id,
  ingreso,
  saldo,
}: {
  id: number
  ingreso: { hora: string; por: string | null } | null
  saldo: number | null
}) {
  const [pendiente, iniciar] = useTransition()
  const [otroImporte, setOtroImporte] = useState(false)

  function correr(tarea: () => Promise<void>, exito: string) {
    iniciar(async () => {
      try {
        await tarea()
        toast.success(exito)
      } catch {
        toast.error("No se pudo guardar. Probá de nuevo.")
      }
    })
  }

  function cobrarAhora(forma: FormaDeCobro, importe?: number) {
    const monto = importe ?? (saldo ? cobroDelSaldo(saldo, forma).importe : 0)
    if (!window.confirm(`¿Cobrar ${pesos(monto)} en ${nombreDeForma[forma]}?`)) return
    iniciar(async () => {
      const resultado = await cobrar({ id, forma, importe })
      if (resultado.ok) {
        toast.success(`Cobrado ${pesos(resultado.importe)} en ${nombreDeForma[forma]}.`)
        setOtroImporte(false)
      } else {
        toast.error(resultado.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      {ingreso ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-[#e8f4e3] px-3 py-1.5 font-bold text-[#3f6b12]">
            Ingresó {ingreso.hora}
            {ingreso.por ? ` · ${ingreso.por}` : ""}
          </span>
          <button
            type="button"
            disabled={pendiente}
            className="text-panel-muted underline-offset-4 hover:underline"
            onClick={() => correr(() => deshacerIngreso(id), "Ingreso deshecho.")}
          >
            Deshacer
          </button>
        </div>
      ) : (
        <Button
          type="button"
          disabled={pendiente}
          className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado"
          onClick={() => correr(() => marcarIngreso(id), "Ingreso registrado.")}
        >
          Marcar ingreso
        </Button>
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
              toast.error("Cargá un importe.")
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
