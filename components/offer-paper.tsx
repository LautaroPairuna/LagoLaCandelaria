import type { ReactNode } from "react"

const ink = "#d5c6b2"

type Pt = { x: number; y: number }
type Cubic = [Pt, Pt, Pt, Pt]

const line = {
  fill: "none" as const,
  stroke: ink,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function bez(t: number, a: Pt, b: Pt, c: Pt, d: Pt): Pt {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}

function tangent(t: number, a: Pt, b: Pt, c: Pt, d: Pt): Pt {
  const u = 1 - t
  return {
    x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
    y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
  }
}

function deg(v: Pt) {
  return (Math.atan2(v.y, v.x) * 180) / Math.PI
}

const n = (value: number) => Math.round(value * 10) / 10

function stemD(segments: Cubic[]) {
  return segments
    .map(([a, b, c, d], index) => {
      const head = index === 0 ? `M${n(a.x)} ${n(a.y)}` : ""
      return `${head}C${n(b.x)} ${n(b.y)} ${n(c.x)} ${n(c.y)} ${n(d.x)} ${n(d.y)}`
    })
    .join("")
}

const leafMid: Cubic = [
  { x: 0, y: 0 },
  { x: -1, y: -58 },
  { x: 1, y: -120 },
  { x: 0, y: -176 },
]

function Leaf({ scale = 1 }: { scale?: number }) {
  const veins = [0.38, 0.54, 0.7, 0.84].map((t, index) => {
    const origin = bez(t, ...leafMid)
    const reach = 26 - index * 5
    const rise = 12 + index * 3
    return { origin, reach, rise }
  })

  return (
    <g transform={`scale(${scale})`} {...line} strokeWidth={1.2}>
      <path d="M0 0C-1-18-14-40-46-92C-62-128-30-164 0-176C30-164 62-128 46-92C14-40 1-18 0 0" />
      <path d="M0 0C-1-58 1-120 0-176" strokeWidth={1} />
      {veins.map(({ origin, reach, rise }) => (
        <g key={origin.y}>
          <path
            d={`M${n(origin.x)} ${n(origin.y)}C${n(origin.x - reach * 0.4)} ${n(origin.y - rise * 0.45)} ${n(origin.x - reach * 0.8)} ${n(origin.y - rise)} ${n(origin.x - reach)} ${n(origin.y - rise * 1.35)}`}
            strokeWidth={0.8}
          />
          <path
            d={`M${n(origin.x)} ${n(origin.y)}C${n(origin.x + reach * 0.4)} ${n(origin.y - rise * 0.45)} ${n(origin.x + reach * 0.8)} ${n(origin.y - rise)} ${n(origin.x + reach)} ${n(origin.y - rise * 1.35)}`}
            strokeWidth={0.8}
          />
        </g>
      ))}
    </g>
  )
}

function Flower() {
  const petals = [
    { angle: -8, d: "M0 0C-8-14-28-42-16-70C-4-82 14-70 18-48C18-26 8-10 0 0" },
    { angle: 66, d: "M0 0C-6-16-20-46-6-72C8-82 18-64 18-44C14-22 6-8 0 0" },
    { angle: 140, d: "M0 0C-8-12-26-38-14-64C-2-76 12-66 16-44C16-24 7-10 0 0" },
    { angle: 214, d: "M0 0C-5-14-18-44-4-68C8-78 18-60 17-40C14-20 6-8 0 0" },
    { angle: 286, d: "M0 0C-7-13-24-40-12-66C0-78 14-68 17-46C16-24 7-9 0 0" },
  ]

  return (
    <g {...line} strokeWidth={1.15}>
      <path d="M0 42C0 28 0 14 0 0" />
      {[32, 104, 176, 248, 320].map((angle) => (
        <path key={angle} d="M0 0C-5-8-14-24-7-36C0-42 9-32 9-20C7-8 3-3 0 0" transform={`rotate(${angle})`} strokeWidth={0.9} />
      ))}
      {petals.map((petal) => (
        <path key={petal.angle} d={petal.d} transform={`rotate(${petal.angle})`} />
      ))}
      {[12, 84, 156, 228, 300].map((angle) => (
        <path key={`stamen-${angle}`} d="M0 0C0.2-5 0-10 0-13" transform={`rotate(${angle})`} strokeWidth={0.7} />
      ))}
    </g>
  )
}

function OnStem({
  segment,
  t,
  children,
  turn = 0,
}: {
  segment: Cubic
  t: number
  children: ReactNode
  turn?: number
}) {
  const point = bez(t, ...segment)
  const aim = deg(tangent(t, ...segment)) + 90 + turn
  return (
    <g transform={`translate(${n(point.x)} ${n(point.y)})`}>
      <g transform={`rotate(${n(aim)})`}>{children}</g>
    </g>
  )
}

function BranchPlate() {
  const segments: Cubic[] = [
    [
      { x: 92, y: 700 },
      { x: 156, y: 575 },
      { x: 24, y: 490 },
      { x: 98, y: 370 },
    ],
    [
      { x: 98, y: 370 },
      { x: 118, y: 250 },
      { x: 108, y: 140 },
      { x: 108, y: 52 },
    ],
  ]

  const leaves: { seg: number; t: number; side: number; scale: number }[] = [
    { seg: 0, t: 0.28, side: -1, scale: 0.92 },
    { seg: 0, t: 0.62, side: 1, scale: 1.02 },
    { seg: 1, t: 0.4, side: -1, scale: 0.74 },
  ]

  return (
    <svg className="offer-botanical offer-botanical-left" viewBox="0 20 320 710" aria-hidden>
      <path d={stemD(segments)} {...line} strokeWidth={1.25} />
      {leaves.map((leaf) => (
        <OnStem key={`${leaf.seg}-${leaf.t}`} segment={segments[leaf.seg]} t={leaf.t} turn={leaf.side * 62}>
          <Leaf scale={leaf.scale} />
        </OnStem>
      ))}
      <OnStem segment={segments[1]} t={1}>
        <Flower />
      </OnStem>
    </svg>
  )
}

function PinnatePlate() {
  const segments: Cubic[] = [
    [
      { x: 470, y: 820 },
      { x: 430, y: 660 },
      { x: 510, y: 520 },
      { x: 430, y: 390 },
    ],
    [
      { x: 430, y: 390 },
      { x: 360, y: 270 },
      { x: 470, y: 160 },
      { x: 400, y: 36 },
    ],
  ]

  const leaflets: { seg: number; t: number; side: number; scale: number }[] = [
    { seg: 0, t: 0.22, side: -1, scale: 0.46 },
    { seg: 0, t: 0.34, side: 1, scale: 0.5 },
    { seg: 0, t: 0.55, side: -1, scale: 0.56 },
    { seg: 0, t: 0.68, side: 1, scale: 0.52 },
    { seg: 1, t: 0.28, side: -1, scale: 0.44 },
    { seg: 1, t: 0.42, side: 1, scale: 0.4 },
    { seg: 1, t: 0.64, side: -1, scale: 0.34 },
  ]

  return (
    <svg className="offer-botanical offer-botanical-right" viewBox="250 0 310 900" aria-hidden>
      <path d={stemD(segments)} {...line} strokeWidth={1.2} />
      {leaflets.map((leaflet) => (
        <OnStem key={`${leaflet.seg}-${leaflet.t}`} segment={segments[leaflet.seg]} t={leaflet.t} turn={leaflet.side * 68}>
          <Leaf scale={leaflet.scale} />
        </OnStem>
      ))}
      <OnStem segment={segments[1]} t={1}>
        <Leaf scale={0.5} />
      </OnStem>
    </svg>
  )
}

const pinnaMid: Cubic = [
  { x: 0, y: 0 },
  { x: -1, y: -34 },
  { x: 1, y: -68 },
  { x: 0, y: -102 },
]

function Pinna({ scale = 1 }: { scale?: number }) {
  const veins = [0.34, 0.52, 0.7, 0.86].map((t, index) => {
    const origin = bez(t, ...pinnaMid)
    const len = 16 - index * 2.5
    return { origin, len }
  })

  return (
    <g transform={`scale(${scale})`} {...line} strokeWidth={1.1}>
      <path d="M0 0C-18-24-26-62 0-102C26-62 18-24 0 0" />
      <path d="M0 0C-1-34 1-68 0-102" strokeWidth={0.9} />
      {veins.map(({ origin, len }) => (
        <g key={origin.y}>
          <path
            d={`M${n(origin.x)} ${n(origin.y)}C${n(origin.x - len * 0.45)} ${n(origin.y - len * 0.35)} ${n(origin.x - len)} ${n(origin.y - len * 0.7)} ${n(origin.x - len * 0.85)} ${n(origin.y - len)}`}
            strokeWidth={0.7}
          />
          <path
            d={`M${n(origin.x)} ${n(origin.y)}C${n(origin.x + len * 0.45)} ${n(origin.y - len * 0.35)} ${n(origin.x + len)} ${n(origin.y - len * 0.7)} ${n(origin.x + len * 0.85)} ${n(origin.y - len)}`}
            strokeWidth={0.7}
          />
        </g>
      ))}
    </g>
  )
}

function FernPlate() {
  const segment: Cubic = [
    { x: 168, y: 620 },
    { x: 150, y: 430 },
    { x: 186, y: 240 },
    { x: 156, y: 28 },
  ]
  const pairs = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86]

  return (
    <svg className="offer-botanical offer-botanical-fern" viewBox="40 0 280 660" aria-hidden>
      <path d={stemD([segment])} {...line} strokeWidth={1.15} />
      {pairs.map((t) => (
        <g key={t}>
          <OnStem segment={segment} t={t} turn={-76}>
            <Pinna scale={1.05 - t * 0.5} />
          </OnStem>
          <OnStem segment={segment} t={t + 0.04} turn={76}>
            <Pinna scale={0.98 - t * 0.46} />
          </OnStem>
        </g>
      ))}
      <OnStem segment={segment} t={1} turn={0}>
        <Pinna scale={0.62} />
      </OnStem>
    </svg>
  )
}

export function OfferPaper() {
  return (
    <div className="offer-paper" aria-hidden>
      <div className="offer-grain" />
      <BranchPlate />
      <PinnatePlate />
      <FernPlate />
    </div>
  )
}
