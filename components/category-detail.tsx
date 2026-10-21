import Link from "next/link"
import { Clock, Layers, Shield, UserRound, Users, type LucideIcon } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { Foto } from "@/components/foto"
import { GroundsPlan } from "@/components/grounds-plan"
import { OfferLines } from "@/components/offer-lines"
import { RestaurantCatalog, type RestaurantMenuItem } from "@/components/restaurant-catalog"
import { reserveHref, type Category, type FactId, type Photo, type Subactivity } from "@/lib/categories"
import styles from "@/components/activity-gallery.module.css"

const factIcons: Record<FactId, LucideIcon> = {
  seguridad: Shield,
  edades: Users,
  instructor: UserRound,
  horario: Clock,
  variantes: Layers,
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
  restaurantMenu,
}: {
  category: Category
  others: Category[]
  collectionHref?: string
  collectionLabel?: string
  othersLabel?: string
  otherBase?: string
  showReserve?: boolean
  compact?: boolean
  restaurantMenu?: RestaurantMenuItem[]
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
        restaurantMenu={restaurantMenu}
      />
    )
  }

  const canReserve = showReserve ?? Boolean(category.reserve)
  return (
    <article className="bg-foam text-ink">
      <header className="relative flex min-h-[78svh] items-end overflow-hidden text-cream">
        <Foto
          src={category.banner.src}
          alt={category.banner.alt}
          prioridad
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
  restaurantMenu,
}: {
  category: Category
  others: Category[]
  collectionHref: string
  collectionLabel: string
  othersLabel: string
  otherBase: string
  restaurantMenu?: RestaurantMenuItem[]
}) {
  const categoryPhotos = [category.banner, ...category.subactivities.flatMap((item) => item.photos)]

  return (
    <article className="bg-foam text-ink">
      <header className="relative flex min-h-[440px] items-end overflow-hidden text-cream md:min-h-[min(62svh,640px)]">
        <Foto
          src={category.banner.src}
          alt={category.banner.alt}
          prioridad
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
          <section aria-label="Actividades en detalle">
            <div>
              {category.subactivities.map((item, index) => (
                <ActivityGalleryCard
                  key={item.slug}
                  item={item}
                  index={index}
                  categoryTitle={category.title}
                  categorySlug={category.slug}
                  photoPool={categoryPhotos}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {restaurantMenu ? <RestaurantCatalog items={restaurantMenu} /> : null}

      <div className="detail-aside">
        <OthersList others={others} othersLabel={othersLabel} otherBase={otherBase} compact />
      </div>
    </article>
  )
}

function briefText(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]
  return sentences.slice(0, 2).join(" ").trim()
}

function ActivityGalleryCard({
  item,
  index,
  categoryTitle,
  categorySlug,
  photoPool,
}: {
  item: Subactivity
  index: number
  categoryTitle: string
  categorySlug: string
  photoPool: Photo[]
}) {
  const photos: Photo[] = []
  for (const photo of [...item.photos, ...photoPool]) {
    if (!photos.some((candidate) => candidate.src === photo.src)) photos.push(photo)
    if (photos.length === 4) break
  }
  const uniquePhotos = [...photos]
  while (photos.length < 4 && uniquePhotos.length > 0) {
    const repeated = uniquePhotos[photos.length % uniquePhotos.length]
    if (!repeated) break
    photos.push(repeated)
  }
  const visiblePhotos = photos.slice(0, 4)
  const themes =
    categorySlug === "bar"
      ? [styles.wine, styles.sand]
      : [styles.orange, styles.blue, styles.green, styles.coral]
  const theme = themes[index % themes.length] ?? styles.orange
  const fasteners = [styles.pin, styles.clip, styles.tape, styles.sticker]
  const fastener = fasteners[index % fasteners.length] ?? styles.pin

  return (
    <section
      id={item.slug}
      data-photo-count={visiblePhotos.length}
      className={`${styles.scene} ${theme} scroll-mt-24`}
    >
      <div className={styles.photos}>
        {visiblePhotos.map((photo, photoIndex) => {
          return (
            <div
              key={`${item.slug}-${photoIndex}`}
              className={`${styles.photoFrame} ${styles[`photo${photoIndex + 1}`]}`}
            >
              <span className={styles.photoTape} aria-hidden />
              <Foto
                src={photo.src}
                alt={photo.alt}
                sizes="(min-width: 768px) 50vw, 100vw"
                className={styles.photo}
                style={{ objectPosition: photo.position ?? "center" }}
              />
            </div>
          )
        })}
      </div>
      <div
        className={`${styles.copy} ${index % 2 === 1 ? styles.copyClockwise : styles.copyCounterClockwise}`}
      >
        <span className={`${styles.fastener} ${fastener}`} aria-hidden />
        <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-lake-ink uppercase">
          0{index + 1} — {categoryTitle}
        </p>
        <h3 className="font-display mt-2 text-4xl leading-[0.94] tracking-tight md:text-6xl">
          {item.name}
        </h3>
        <p className="mt-3 text-base leading-snug text-ink/75 md:text-lg">{briefText(item.how)}</p>
      </div>
    </section>
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
          <Foto
            key={`${item.slug}-${photoIndex}`}
            src={photo.src}
            alt={photo.alt}
            sizes="(min-width: 768px) 45vw, 100vw"
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
