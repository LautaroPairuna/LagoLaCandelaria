"use client"

import { useState } from "react"

export type Serie = { nombre: string; color: string }
export type Columna = { etiqueta: string; detalle?: string; valores: number[] }

const ALTO = 220
const MARGEN = { arriba: 22, abajo: 28, izquierda: 40, derecha: 8 }
const ANCHO_COLUMNA = 24
const SEPARACION = 2
const REDONDEO = 4

function escalaLimpia(maximo: number) {
  if (maximo <= 0) return { tope: 4, paso: 1 }
  const crudo = maximo / 4
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 2.5, 5, 10].map((factor) => factor * potencia).find((valor) => valor >= crudo) ?? crudo
  return { tope: Math.ceil(maximo / paso) * paso, paso }
}

const numero = new Intl.NumberFormat("es-AR")

function columnaRedondeada(x: number, y: number, ancho: number, alto: number) {
  const r = Math.min(REDONDEO, alto, ancho / 2)
  return `M${x},${y + alto}V${y + r}Q${x},${y} ${x + r},${y}H${x + ancho - r}Q${x + ancho},${y} ${x + ancho},${y + r}V${y + alto}Z`
}

export function ColumnasApiladas({ titulo, columnas, series }: { titulo: string; columnas: Columna[]; series: Serie[] }) {
  const [activa, setActiva] = useState<number | null>(null)
  const anchoTotal = Math.max(320, columnas.length * 64)
  const totales = columnas.map((columna) => columna.valores.reduce((suma, valor) => suma + valor, 0))
  const { tope, paso } = escalaLimpia(Math.max(...totales, 0))
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const banda = (anchoTotal - MARGEN.izquierda - MARGEN.derecha) / Math.max(columnas.length, 1)
  const y = (valor: number) => MARGEN.arriba + altoUtil - (valor / tope) * altoUtil
  const marcas = Array.from({ length: Math.round(tope / paso) + 1 }, (_, indice) => indice * paso)
  const varias = series.length > 1

  return (
    <figure className="relative">
      <figcaption className="sr-only">{titulo}</figcaption>
      {varias ? (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-panel-muted" aria-label="Referencias">
          {series.map((serie) => (
            <li key={serie.nombre} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: serie.color }} aria-hidden />
              {serie.nombre}
            </li>
          ))}
        </ul>
      ) : null}
      <svg viewBox={`0 0 ${anchoTotal} ${ALTO}`} className="h-auto w-full" role="img" aria-label={titulo}>
        {marcas.map((marca) => (
          <g key={marca}>
            <line x1={MARGEN.izquierda} x2={anchoTotal - MARGEN.derecha} y1={y(marca)} y2={y(marca)} stroke="#f0e2d2" strokeWidth={1} />
            <text x={MARGEN.izquierda - 8} y={y(marca)} dy="0.32em" textAnchor="end" className="fill-panel-muted text-[11px] tabular-nums">
              {numero.format(marca)}
            </text>
          </g>
        ))}
        {columnas.map((columna, indice) => {
          const x = MARGEN.izquierda + indice * banda + (banda - ANCHO_COLUMNA) / 2
          const ultimo = columna.valores.reduce((ultimoConValor, valor, posicion) => (valor > 0 ? posicion : ultimoConValor), -1)
          let base = 0
          return (
            <g
              key={columna.etiqueta}
              tabIndex={0}
              aria-label={`${columna.etiqueta}: ${series.map((serie, posicion) => `${serie.nombre} ${columna.valores[posicion]}`).join(", ")}`}
              onPointerEnter={() => setActiva(indice)}
              onPointerLeave={() => setActiva(null)}
              onFocus={() => setActiva(indice)}
              onBlur={() => setActiva(null)}
              className="outline-none"
            >
              <rect x={MARGEN.izquierda + indice * banda} y={MARGEN.arriba} width={banda} height={altoUtil} fill={activa === indice ? "#fbf4eb" : "transparent"} />
              {columna.valores.map((valor, posicion) => {
                if (valor <= 0) return null
                const arriba = y(base + valor)
                const abajo = y(base)
                base += valor
                const alto = Math.max(abajo - arriba - (posicion === ultimo ? 0 : SEPARACION), 1)
                return posicion === ultimo ? (
                  <path key={posicion} d={columnaRedondeada(x, arriba, ANCHO_COLUMNA, alto)} fill={series[posicion].color} />
                ) : (
                  <rect key={posicion} x={x} y={arriba + SEPARACION} width={ANCHO_COLUMNA} height={alto} fill={series[posicion].color} />
                )
              })}
              {totales[indice] > 0 ? (
                <text x={x + ANCHO_COLUMNA / 2} y={y(totales[indice]) - 6} textAnchor="middle" className="fill-panel-ink text-[11px] font-semibold">
                  {numero.format(totales[indice])}
                </text>
              ) : null}
              <text x={x + ANCHO_COLUMNA / 2} y={ALTO - 8} textAnchor="middle" className="fill-panel-muted text-[11px]">
                {columna.etiqueta}
              </text>
            </g>
          )
        })}
      </svg>
      {activa !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute top-8 z-10 min-w-40 rounded-xl bg-white px-3 py-2 text-xs shadow-[0_8px_24px_rgba(58,42,24,0.16)]"
          style={{ left: `clamp(0px, calc(${((MARGEN.izquierda + (activa + 0.5) * banda) / anchoTotal) * 100}% - 5rem), calc(100% - 10rem))` }}
        >
          <p className="font-semibold text-panel-muted">{columnas[activa].detalle ?? columnas[activa].etiqueta}</p>
          <ul className="mt-1 space-y-0.5">
            {series.map((serie, posicion) => (
              <li key={serie.nombre} className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded" style={{ background: serie.color }} aria-hidden />
                <strong className="tabular-nums text-panel-ink">{numero.format(columnas[activa].valores[posicion])}</strong>
                <span className="text-panel-muted">{serie.nombre}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-panel-muted">Ver como tabla</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead>
            <tr className="text-panel-muted">
              <th className="py-1 font-semibold" />
              {series.map((serie) => (
                <th key={serie.nombre} className="py-1 text-right font-semibold">
                  {serie.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columnas.map((columna) => (
              <tr key={columna.etiqueta} className="border-t border-panel-line">
                <th className="py-1 font-semibold">{columna.detalle ?? columna.etiqueta}</th>
                {columna.valores.map((valor, posicion) => (
                  <td key={posicion} className="py-1 text-right">
                    {numero.format(valor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export function BarrasHorizontales({ titulo, filas, color }: { titulo: string; filas: { etiqueta: string; valor: number; detalle: string }[]; color: string }) {
  const maximo = Math.max(...filas.map((fila) => fila.valor), 1)
  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <ul className="space-y-3">
        {filas.map((fila) => (
          <li key={fila.etiqueta} className="group" title={`${fila.etiqueta}: ${fila.detalle}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">{fila.etiqueta}</span>
              <span className="text-panel-muted">{fila.detalle}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div
                className="h-6 rounded-r-[4px] transition-opacity group-hover:opacity-85"
                style={{ width: `${(fila.valor / maximo) * 85}%`, minWidth: fila.valor > 0 ? 4 : 0, background: color }}
              />
              <span className="text-sm font-bold tabular-nums">{numero.format(fila.valor)}</span>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  )
}
