import Link from "next/link"
import { Clock, Layers, Shield, UserRound, Users, type LucideIcon } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { GroundsPlan } from "@/components/grounds-plan"
import { OfferLines } from "@/components/offer-lines"
import { PhotoCarousel } from "@/components/photo-carousel"
import { reserveHref, type Category, type FactId, type Subactivity } from "@/lib/categories"

const factIcons: Record<FactId, LucideIcon> = {
  seguridad: Shield,
  edades: Users,
  instructor: UserRound,
  horario: Clock,
  variantes: Layers,
}

const STOP_WORDS = new Set([
  "para",
  "cada",
  "esta",
  "este",
  "como",
  "donde",
  "desde",
  "tiene",
  "entre",
  "sobre",
  "hacia",
  "cuando",
  "quien",
  "toda",
  "todo",
  "unas",
  "unos",
  "actividad",
  "actividades",
])

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function tokens(...values: string[]) {
  const words = values.flatMap((value) => fold(value).split(/[^a-z0-9]+/))
  return [...new Set(words.filter((word) => word.length > 3 && !STOP_WORDS.has(word)))]
}

function score(keys: string[], text: string) {
  const hay = fold(text)
  return keys.reduce((total, key) => total + (hay.includes(key) ? 1 : 0), 0)
}

function notesFor(category: Category) {
  const keys = category.subactivities.map((item) => tokens(item.chip, item.name))
  const bySlug = new Map<string, string[]>(category.subactivities.map((item) => [item.slug, []]))
  const assignedSafety = new Set<number>()
  const assignedInfra = new Set<number>()

  function place(slug: string, line: string) {
    const lines = bySlug.get(slug)
    if (!lines || lines.includes(line) || lines.length >= 3) return false
    lines.push(line)
    return true
  }

  function bestIndex(rankAt: (index: number) => number) {
    let best = -1
    let bestRank = 0
    category.subactivities.forEach((_, index) => {
      const rank = rankAt(index)
      if (rank > bestRank) {
        bestRank = rank
        best = index
      }
    })
    return best
  }

  category.infrastructure.forEach((entry, entryIndex) => {
    const index = bestIndex((itemIndex) => score(keys[itemIndex] ?? [], entry.name))
    if (index < 0) return
    if (place(category.subactivities[index].slug, entry.text)) assignedInfra.add(entryIndex)
  })

  category.safety.forEach((step, entryIndex) => {
    const index = bestIndex((itemIndex) => score(keys[itemIndex] ?? [], step))
    if (index < 0) return
    if (place(category.subactivities[index].slug, step)) assignedSafety.add(entryIndex)
  })

  category.subactivities.forEach((item, itemIndex) => {
    const lines = bySlug.get(item.slug)
    if (!lines || lines.length > 0) return
    const fallback = category.safety
      .map((text, index) => ({ text, index, rank: score(keys[itemIndex] ?? [], text) }))
      .sort((a, b) => b.rank - a.rank)[0]
    if (fallback && fallback.rank > 0) place(item.slug, fallback.text)
  })

  return {
    bySlug,
    safety: category.safety.filter((_, index) => !assignedSafety.has(index)),
    infrastructure: category.infrastructure.filter((_, index) => !assignedInfra.has(index)),
  }
}

export function CategoryDetail({
  category,
  others,
  collectionHref = "/actividades",
  collectionLabel = "Todas las actividades",
  othersLabel = "Otras actividades",
  otherBase = "/categorias",
  showReserve,
  compact = false,
}: {
  category: Category
  others: Category[]
  collectionHref?: string
  collectionLabel?: string
  othersLabel?: string
  otherBase?: string
  showReserve?: boolean
  compact?: boolean
}) {
  if (compact) {
    return (
      <InformativeDetail
        category={category}
        others={others}
        collectionHref={collectionHref}
        collectionLabel={collectionLabel}
        othersLabel={othersLabel}
        otherBase={otherBase}
      />
    )
  }

  const canReserve = showReserve ?? Boolean(category.reserve)
  return (
    <article className="bg-foam text-ink">
      <header className="relative flex min-h-[78svh] items-end overflow-hidden text-cream">
        <img
          src={category.banner.src}
          alt={category.banner.alt}
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: category.banner.position ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/30 to-black/25" />
        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 pt-32 pb-12 md:px-8 md:pb-16">
          <p className="text-sm">
            <Link href={collectionHref} className="text-cream/90 underline-offset-4 hover:underline">
              ← {collectionLabel}
            </Link>
          </p>
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-cream/80 uppercase">
            {category.kicker}
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-[clamp(3rem,7vw,6rem)] leading-[0.92] tracking-[-0.03em]">
            {category.title}
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        <p className="max-w-3xl text-lg leading-relaxed text-ink/85 md:text-xl">{category.intro}</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {category.facts.map((fact) => {
            const Icon = factIcons[fact.id]
            return (
              <li key={fact.id} className="rounded-[1.15rem] bg-cream px-4 py-4 ring-1 ring-ink/10">
                <Icon className="size-5 text-lake-ink" aria-hidden />
                <p className="mt-3 text-[0.7rem] font-semibold tracking-[0.16em] text-ink/50 uppercase">
                  {fact.label}
                </p>
                <p className="mt-1.5 text-sm leading-snug">{fact.value}</p>
              </li>
            )
          })}
        </ul>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Subactividades">
          {category.subactivities.map((item) => (
            <a
              key={item.slug}
              href={`#${item.slug}`}
              className="rounded-full bg-lake-soft px-3 py-1.5 text-sm font-semibold text-lake-ink"
            >
              {item.chip}
            </a>
          ))}
        </nav>
      </section>

      <section aria-labelledby="detalle" className="mx-auto max-w-[1120px] px-5 pb-6 md:px-8">
        <h2 id="detalle" className="font-display text-4xl tracking-tight md:text-5xl">
          Cómo se hace
        </h2>
        <div className="mt-8">
          {category.subactivities.map((item, index) => (
            <SubactivityBlock key={item.slug} item={item} index={index} categoryTitle={category.title} />
          ))}
        </div>
      </section>

      <section className="border-t border-ink/10 bg-cream">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <p className="kicker">Infraestructura</p>
            <h2 className="font-display mt-3 text-4xl tracking-tight">Con qué se brinda</h2>
            <ul className="mt-6">
              {category.infrastructure.map((item) => (
                <li key={item.name} className="border-t border-ink/15 py-4">
                  <p className="font-display text-2xl tracking-tight">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker">Cuidado</p>
            <h2 className="font-display mt-3 text-4xl tracking-tight">{category.safetyTitle}</h2>
            <ol className="mt-6 space-y-4">
              {category.safety.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-ink/15 pt-4">
                  <span className="font-display text-lake-ink">0{index + 1}</span>
                  <p className="leading-relaxed text-ink/80">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {category.grounds ? <GroundsPlan grounds={category.grounds} /> : null}

      {canReserve && category.reserve ? (
        <section className="texture-contour text-cream">
          <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-6 px-5 py-16 md:px-8 md:py-24">
            <h2 className="font-display max-w-3xl text-4xl leading-[1.02] tracking-tight md:text-6xl">
              Cuando esta sea la opción, sigue la reserva.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-cream/85">
              Acá no se confirma la fecha ni hay un pago. El botón abre la consulta con esta opción ya marcada. El equipo la cierra por teléfono.
            </p>
            <ButtonLink
              href={reserveHref(category)}
              className="h-auto min-h-14 px-8 py-3 text-center text-lg whitespace-normal"
            >
              ¡Quiero reservar esta opción!
            </ButtonLink>
          </div>
        </section>
      ) : null}

      <OthersList others={others} othersLabel={othersLabel} otherBase={otherBase} />
    </article>
  )
}

function InformativeDetail({
  category,
  others,
  collectionHref,
  collectionLabel,
  othersLabel,
  otherBase,
}: {
  category: Category
  others: Category[]
  collectionHref: string
  collectionLabel: string
  othersLabel: string
  otherBase: string
}) {
  const notes = notesFor(category)
  const hasShared =
    notes.safety.length > 0 || notes.infrastructure.length > 0

  return (
    <article className="bg-foam text-ink">
      <header className="relative flex min-h-[440px] items-end overflow-hidden text-cream md:min-h-[min(62svh,640px)]">
        <img
          src={category.banner.src}
          alt={category.banner.alt}
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: category.banner.position ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/28 to-black/15" />
        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 pt-28 pb-12 md:px-8 md:pb-16">
          <p className="text-sm">
            <Link href={collectionHref} className="text-cream/90 underline-offset-4 hover:underline">
              ← {collectionLabel}
            </Link>
          </p>
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-cream/80 uppercase">
            {category.kicker}
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-[clamp(3rem,6.4vw,5.4rem)] leading-[0.92] tracking-[-0.03em]">
            {category.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-snug text-cream/90">{category.summary}</p>
        </div>
      </header>

      <div className="offer-world">
        <OfferLines tiles={8} />
        <div className="relative z-10">
          <section className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-12">
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {category.facts.map((fact) => {
                const Icon = factIcons[fact.id]
                return (
                  <li key={fact.id} className="flex flex-col items-center text-center">
                    <span className="grid size-[4.75rem] place-items-center rounded-full bg-white text-lake-ink shadow-[0_12px_28px_rgba(42,32,22,0.08)] ring-1 ring-ink/10">
                      <Icon className="size-8" strokeWidth={1.5} aria-hidden />
                    </span>
                    <p className="mt-3 text-[0.68rem] font-semibold tracking-[0.16em] text-lake-ink uppercase">
                      {fact.label}
                    </p>
                    <p className="mt-1.5 max-w-[18ch] text-sm leading-snug text-ink/65">{fact.value}</p>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="mx-auto max-w-[1120px] px-5 pb-2 text-center md:px-8">
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-ink/85">{category.intro}</p>
            <nav className="mt-6 flex flex-wrap justify-center gap-3" aria-label="Subactividades">
              {category.subactivities.map((item) => (
                <a
                  key={item.slug}
                  href={`#${item.slug}`}
                  className="rounded-full border-[2.5px] border-orange bg-white px-7 py-3 text-lg font-bold text-ink shadow-[0_10px_24px_rgba(255,122,20,0.16)] transition hover:bg-orange hover:text-white"
                >
                  {item.chip}
                </a>
              ))}
            </nav>
          </section>

          <section aria-labelledby="detalle" className="mx-auto max-w-[1120px] px-5 pt-8 pb-12 md:px-8 md:pb-16">
            <h2 id="detalle" className="font-display text-center text-3xl tracking-tight md:text-4xl">
              Cómo se hace
            </h2>
            <div className="mt-6">
              {category.subactivities.map((item, index) => {
                const photoOnRight = index % 2 === 1
                return (
                  <section
                    key={item.slug}
                    id={item.slug}
                    className={`scroll-mt-24 grid items-center gap-5 border-t border-ink/10 py-8 md:gap-10 md:py-10 ${
                      photoOnRight
                        ? "md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
                        : "md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
                    }`}
                  >
                    <div className={photoOnRight ? "md:order-2" : undefined}>
                      <PhotoCarousel photos={item.photos} />
                    </div>
                    <div className={photoOnRight ? "md:order-1" : undefined}>
                      <p className="text-xs font-semibold tracking-[0.16em] text-lake-ink uppercase">
                        0{index + 1} — {category.title}
                      </p>
                      <h3 className="font-display mt-2 text-3xl tracking-tight md:text-4xl">{item.name}</h3>
                      <p className="mt-3 text-base leading-relaxed text-ink/80">{item.how}</p>
                      {notes.bySlug.get(item.slug)?.length ? (
                        <div className="mt-4">
                          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-ink/50 uppercase">
                            Indicaciones
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {notes.bySlug.get(item.slug)?.map((line) => (
                              <li key={line} className="flex gap-2 text-sm leading-snug text-ink/80">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lake-ink" aria-hidden />
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </section>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="detail-aside">
        {hasShared ? (
          <section className="mx-auto grid max-w-[1120px] gap-10 px-5 py-12 md:grid-cols-2 md:px-8 md:py-16">
            {notes.infrastructure.length > 0 ? (
              <div>
                <p className="kicker">Infraestructura</p>
                <h2 className="font-display mt-2 text-3xl tracking-tight">Con qué se brinda</h2>
                <ul className="mt-4">
                  {notes.infrastructure.map((item) => (
                    <li key={item.name} className="border-t border-ink/15 py-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm leading-relaxed text-ink/75">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {notes.safety.length > 0 ? (
              <div>
                <p className="kicker">Cuidado</p>
                <h2 className="font-display mt-2 text-3xl tracking-tight">{category.safetyTitle}</h2>
                <ul className="mt-4 space-y-2">
                  {notes.safety.map((step) => (
                    <li key={step} className="border-t border-ink/15 pt-3 text-sm leading-relaxed text-ink/80">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
        <OthersList others={others} othersLabel={othersLabel} otherBase={otherBase} compact />
      </div>
    </article>
  )
}

function SubactivityBlock({
  item,
  index,
  categoryTitle,
}: {
  item: Subactivity
  index: number
  categoryTitle: string
}) {
  return (
    <section
      id={item.slug}
      className="scroll-mt-24 grid items-center gap-6 border-t border-ink/15 py-10 md:grid-cols-2 md:gap-10 md:py-14"
    >
      <div className={index % 2 === 1 ? "md:order-2" : undefined}>
        <p className="kicker">
          0{index + 1} — {categoryTitle}
        </p>
        <h3 className="font-display mt-3 text-4xl tracking-tight md:text-5xl">{item.name}</h3>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">{item.how}</p>
      </div>
      <div className={`grid gap-3 ${index % 2 === 1 ? "md:order-1" : ""}`}>
        {item.photos.map((photo, photoIndex) => (
          <img
            key={`${item.slug}-${photoIndex}`}
            src={photo.src}
            alt={photo.alt}
            className="aspect-[4/3] w-full rounded-[1.15rem] object-cover"
            style={{ objectPosition: photo.position ?? "center" }}
          />
        ))}
      </div>
    </section>
  )
}

function OthersList({
  others,
  othersLabel,
  otherBase,
  compact = false,
}: {
  others: Category[]
  othersLabel: string
  otherBase: string
  compact?: boolean
}) {
  return (
    <section className={`mx-auto max-w-[1120px] px-5 md:px-8 ${compact ? "py-8" : "py-14"}`}>
      <p className="kicker">{othersLabel}</p>
      <ul className="mt-3 border-t border-ink/15">
        {others.map((item) => (
          <li key={item.slug} className="border-b border-ink/15">
            <Link
              href={`${otherBase}/${item.slug}`}
              className="group flex items-baseline justify-between gap-6 py-3"
            >
              <span className="font-display text-2xl tracking-tight group-hover:text-lake-ink md:text-3xl">
                {item.title}
              </span>
              <span aria-hidden className="text-ink/40">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
