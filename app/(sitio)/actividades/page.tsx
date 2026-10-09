import Link from "next/link"

import { Foto } from "@/components/foto"
import { PageHero } from "@/components/page-hero"
import { categories } from "@/lib/categories"
import { seoDePagina, seoDePaginas } from "@/lib/seo"

export const metadata = seoDePagina({ ...seoDePaginas.actividades, ruta: "/actividades" })

export default function ActividadesPage() {
  return (
    <main className="bg-foam text-ink">
      <PageHero kicker="Actividades" title={<>El predio, actividad por actividad.</>}>
        La entrada es una sola, al predio. Cada ficha cuenta cómo se hace: el agua, la altura, las canchas, la playa, las parrillas y la mesa. Adentro están la infraestructura, la seguridad y las variantes.
      </PageHero>

      <div className="mx-auto max-w-[1120px] px-5 pb-20 md:px-8">
        <ul className="grid gap-6">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categorias/${category.slug}`}
                className="group grid overflow-hidden rounded-[1.15rem] bg-cream md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
              >
                <Foto
                  src={category.banner.src}
                  alt=""
                  sizes="(min-width: 768px) 460px, 100vw"
                  className="h-52 w-full object-cover md:h-full md:min-h-56"
                  style={{ objectPosition: category.banner.position ?? "center" }}
                />
                <span className="block px-6 py-6 md:px-8 md:py-8">
                  <span className="kicker">{category.kicker}</span>
                  <span className="font-display mt-2 block text-4xl tracking-tight group-hover:text-lake-ink md:text-5xl">
                    {category.title}
                  </span>
                  <span className="mt-3 block max-w-md text-lg leading-relaxed text-ink/75">
                    {category.summary}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {category.subactivities.map((item) => (
                      <span
                        key={item.slug}
                        className="rounded-full bg-lake-soft px-3 py-1 text-sm font-semibold text-lake-ink"
                      >
                        {item.chip}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
