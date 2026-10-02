import Link from "next/link"

import type { ZoneId } from "@/lib/offers"
import { cn } from "cn"

type Focus = ZoneId | "predio"

const legend: { id: ZoneId; label: string; href: string }[] = [
  { id: "lago", label: "Lago", href: "/categorias/lago" },
  { id: "playa", label: "Playa, palapas y pileta", href: "/categorias/playa" },
  { id: "parque", label: "Parque aéreo", href: "/categorias/parque-aereo" },
  { id: "canchas", label: "Canchas", href: "/categorias/canchas" },
  { id: "parrillas", label: "Parrillas", href: "/categorias/parrillas" },
  { id: "palapas", label: "Palapas", href: "/categorias/parrillas#palapas" },
  { id: "mesa", label: "Restaurante y bar", href: "/categorias/bar" },
  { id: "bungalows", label: "4 bungalows", href: "/estadia/bungalows" },
  { id: "carpas", label: "Carpas", href: "/estadia/campamento#campamento-en-carpa" },
  { id: "dormis", label: "Dormis", href: "/estadia/campamento#campamento-en-dormis" },
]

function modeOf(id: ZoneId, primary: Focus[], context: ZoneId[]) {
  if (primary.includes("predio")) return "on"
  if (primary.includes(id)) return "hot"
  if (context.includes(id)) return "near"
  return "dim"
}

export function PredioMap({
  primary,
  context = [],
  label,
}: {
  primary: Focus[]
  context?: ZoneId[]
  label: string
}) {
  const whole = primary.includes("predio")

  function opacity(id: ZoneId) {
    const mode = modeOf(id, primary, context)
    if (mode === "dim") return 0.34
    if (mode === "near") return 0.78
    return 1
  }

  function hot(id: ZoneId) {
    return modeOf(id, primary, context) === "hot" || whole
  }

  return (
    <figure className="overflow-hidden rounded-[1.4rem] border border-ink/10 bg-[#e7f3dc]">
      <svg
        viewBox="0 0 900 640"
        role="img"
        aria-label={label}
        className="h-auto w-full"
      >
        <rect width="900" height="640" fill="#e7f3dc" />
        <ellipse cx="160" cy="120" rx="70" ry="36" fill="#b7d7a4" opacity="0.7" />
        <ellipse cx="760" cy="90" rx="80" ry="40" fill="#c5e0b0" opacity="0.8" />
        <ellipse cx="120" cy="520" rx="90" ry="46" fill="#c5e0b0" opacity="0.75" />
        <ellipse cx="780" cy="250" rx="50" ry="28" fill="#b7d7a4" opacity="0.55" />

        <path
          d="M168 96c120-48 250-52 392-8 118 36 176 128 164 246-14 132-96 214-250 242-168 30-330-8-392-128C28 332 42 168 168 96Z"
          fill="#d3ebc0"
          stroke={whole ? "#ff7a14" : "#3f6b12"}
          strokeWidth={whole ? 4 : 2.5}
        />
        <path
          d="M430 590c18 16 48 22 70 8"
          fill="none"
          stroke="#3a3530"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M250 560C340 500 430 470 520 430C620 380 640 300 700 230"
          fill="none"
          stroke="#fbf5ea"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.85"
        />

        <g opacity={opacity("canchas")}>
          {hot("canchas") ? <ellipse cx="230" cy="188" rx="100" ry="62" fill="#ff7a14" opacity="0.22" /> : null}
          <rect x="168" y="150" width="124" height="76" rx="10" fill="#f4f7ef" stroke="#3a3530" strokeWidth="1.6" />
          <path d="M230 150v76M168 188h124" stroke="#5daa4f" strokeWidth="1.4" />
          <circle cx="230" cy="188" r="10" fill="none" stroke="#5daa4f" strokeWidth="1.4" />
          <text x="230" y="248" textAnchor="middle" fill="#3a3530" fontSize="15" fontWeight="700">
            Canchas
          </text>
        </g>

        <g opacity={opacity("parque")}>
          {hot("parque") ? <ellipse cx="690" cy="168" rx="108" ry="70" fill="#ff7a14" opacity="0.2" /> : null}
          <path d="M620 150L700 118L742 176L668 206Z" fill="none" stroke="#896440" strokeWidth="2" />
          <circle cx="620" cy="150" r="9" fill="#ff7a14" />
          <circle cx="700" cy="118" r="9" fill="#c89a6b" />
          <circle cx="742" cy="176" r="9" fill="#5daa4f" />
          <circle cx="668" cy="206" r="9" fill="#1f7fb5" />
          <text x="690" y="248" textAnchor="middle" fill="#3a3530" fontSize="15" fontWeight="700">
            Altura
          </text>
        </g>

        <g opacity={opacity("lago")}>
          {hot("lago") ? <ellipse cx="390" cy="355" rx="168" ry="130" fill="#ff7a14" opacity="0.16" /> : null}
          <path
            d="M250 280c-30 48-28 120 28 168 62 54 168 58 236-8 58-56 48-150-28-190-62-32-176-30-236 30Z"
            fill="#1f7fb5"
          />
          <path
            d="M280 320c40 10 70-18 120-6 36 8 60 28 96 18"
            fill="none"
            stroke="#fbf5ea"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text x="390" y="366" textAnchor="middle" fill="#fbf5ea" fontSize="18" fontWeight="700">
            Lago
          </text>
        </g>

        <g opacity={opacity("playa")}>
          {hot("playa") ? <ellipse cx="545" cy="318" rx="78" ry="48" fill="#ff7a14" opacity="0.22" /> : null}
          <path d="M490 286c48-28 112-6 122 40-46-8-86 6-122 28-8-24-8-48 0-68Z" fill="#f0d7ae" />
          <ellipse cx="548" cy="352" rx="26" ry="14" fill="#7ec8e3" stroke="#1c71a1" strokeWidth="1.2" />
          <text x="560" y="392" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Playa
          </text>
        </g>

        <g opacity={opacity("carpas")}>
          {hot("carpas") ? <ellipse cx="168" cy="318" rx="62" ry="46" fill="#ff7a14" opacity="0.22" /> : null}
          <path d="M142 336 168 300 194 336Z" fill="#5daa4f" stroke="#24362c" strokeWidth="1.3" />
          <path d="M168 336v-22" stroke="#24362c" strokeWidth="1.2" />
          <text x="168" y="360" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Carpas
          </text>
        </g>

        <g opacity={opacity("dormis")}>
          {hot("dormis") ? <ellipse cx="156" cy="430" rx="70" ry="40" fill="#ff7a14" opacity="0.2" /> : null}
          <rect x="112" y="412" width="88" height="32" rx="3" fill="#f6ebdd" stroke="#3a3530" strokeWidth="1.5" />
          <path d="M112 412h88" stroke="#896440" strokeWidth="4" />
          <path d="M132 412v32M156 412v32M180 412v32" stroke="#c89a6b" strokeWidth="1.2" />
          <text x="156" y="466" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Dormis
          </text>
        </g>

        <g opacity={opacity("bungalows")}>
          {hot("bungalows") ? <ellipse cx="400" cy="500" rx="150" ry="48" fill="#ff7a14" opacity="0.2" /> : null}
          {[
            [292, 468],
            [352, 488],
            [418, 484],
            [478, 460],
          ].map(([x, y], index) => (
            <g key={index} transform={`translate(${x} ${y})`}>
              <path d="M2 16 16 4 30 16" fill={hot("bungalows") ? "#ff7a14" : "#896440"} />
              <rect x="5" y="16" width="22" height="16" rx="1.5" fill="#fffdf8" stroke="#3a3530" strokeWidth="1.2" />
              <text x="16" y="28" textAnchor="middle" fill="#3a3530" fontSize="11" fontWeight="700">
                {index + 1}
              </text>
            </g>
          ))}
          <text x="400" y="538" textAnchor="middle" fill="#3a3530" fontSize="15" fontWeight="700">
            4 bungalows
          </text>
        </g>

        <g opacity={opacity("palapas")}>
          {hot("palapas") ? <ellipse cx="520" cy="430" rx="64" ry="34" fill="#ff7a14" opacity="0.22" /> : null}
          <path d="M488 428 520 398 552 428Z" fill="#e07a2f" stroke="#3a3530" strokeWidth="1.3" />
          <rect x="496" y="428" width="48" height="8" rx="1" fill="#896440" />
          <path d="M512 398v30M528 398v30" stroke="#fffdf8" strokeOpacity="0.7" strokeWidth="1.2" />
          <text x="520" y="456" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Palapas
          </text>
        </g>

        <g opacity={opacity("parrillas")}>
          {hot("parrillas") ? <ellipse cx="300" cy="575" rx="58" ry="32" fill="#ff7a14" opacity="0.22" /> : null}
          <rect x="274" y="558" width="22" height="10" rx="2" fill="#3a3530" />
          <rect x="302" y="558" width="22" height="10" rx="2" fill="#3a3530" />
          <path d="M280 558c2-8 8-8 10 0M308 558c2-8 8-8 10 0" stroke="#ff7a14" strokeWidth="1.4" fill="none" />
          <text x="300" y="590" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Parrillas
          </text>
        </g>

        <g opacity={opacity("mesa")}>
          {hot("mesa") ? (
            <>
              <ellipse cx="650" cy="500" rx="70" ry="40" fill="#ff7a14" opacity="0.2" />
              <ellipse cx="575" cy="345" rx="36" ry="24" fill="#ff7a14" opacity="0.2" />
            </>
          ) : null}
          <rect x="612" y="478" width="78" height="36" rx="4" fill="#fffdf8" stroke="#3a3530" strokeWidth="1.5" />
          <path d="M612 490h78M638 478v36M664 478v36" stroke="#c89a6b" strokeWidth="1.2" />
          <text x="651" y="534" textAnchor="middle" fill="#3a3530" fontSize="14" fontWeight="700">
            Restaurante
          </text>
          <rect x="558" y="332" width="34" height="18" rx="9" fill="#1f7fb5" />
          <text x="575" y="368" textAnchor="middle" fill="#3a3530" fontSize="12" fontWeight="700">
            Bar
          </text>
        </g>

        <g>
          <circle cx="455" cy="602" r="7" fill="#ff7a14" stroke="#3a3530" strokeWidth="1.4" />
          <text x="472" y="607" fill="#3a3530" fontSize="13" fontWeight="700">
            Ingreso
          </text>
        </g>
      </svg>
      <figcaption className="grid gap-2 border-t border-ink/10 bg-cream/80 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {legend.map((item) => {
          const marked = whole || primary.includes(item.id) || context.includes(item.id)
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={primary.includes(item.id) ? "true" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold",
                marked ? "text-ink" : "text-ink/45",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  primary.includes(item.id) || whole ? "bg-orange" : marked ? "bg-lake" : "bg-ink/20",
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </figcaption>
    </figure>
  )
}
