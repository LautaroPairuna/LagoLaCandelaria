import { HORARIO_DEL_PREDIO, horarioDeActividades, reglamentos, type TipoDeReglamento } from "@/lib/reglamentos"

/// El reglamento de un tipo de reserva y, si corresponde, el horario de actividades.
export function ReglamentoVista({ tipo, titulo = true }: { tipo: TipoDeReglamento; titulo?: boolean }) {
  const reglamento = reglamentos[tipo]
  return (
    <div className="space-y-6">
      <div>
        {titulo ? <h2 className="font-display text-3xl tracking-tight">{reglamento.titulo}</h2> : null}
        <ul className="mt-3 space-y-2">
          {reglamento.reglas.map((regla) => (
            <li key={regla} className="flex gap-3 leading-relaxed">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-orange" />
              {regla}
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 text-ink/75">
          {reglamento.parrafos.map((parrafo) => (
            <p key={parrafo} className="leading-relaxed">
              {parrafo}
            </p>
          ))}
          <p className="font-semibold">La administración</p>
        </div>
      </div>
      {reglamento.conHorarios ? (
        <div>
          <h2 className="font-display text-3xl tracking-tight">Horario de actividades</h2>
          <dl className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
            {horarioDeActividades.map((fila) => (
              <div key={fila.actividad} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:gap-4">
                <dt>
                  <span className="font-semibold">{fila.actividad}</span>
                  {fila.nota ? <span className="block text-sm text-ink/65">{fila.nota}</span> : null}
                </dt>
                <dd className="font-semibold tabular-nums sm:text-right">{fila.horario}</dd>
              </div>
            ))}
            <div className="grid gap-1 bg-green-soft px-4 py-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:gap-4">
              <dt className="font-semibold">Horario del predio</dt>
              <dd className="font-semibold tabular-nums sm:text-right">{HORARIO_DEL_PREDIO}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}
