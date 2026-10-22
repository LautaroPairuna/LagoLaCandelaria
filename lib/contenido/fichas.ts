import { categories, stays, type Category } from "@/lib/categories"
import type { Campo, FotoConTexto } from "@/lib/contenido/campos"

/// Las fichas de actividades (/categorias) y de estadías (/estadia) que se editan desde el
/// panel: lo que muestran las páginas (título, resumen, foto y cada actividad con su
/// texto y sus fotos). La dirección de cada ficha y de cada actividad, la reserva a la
/// que llevan y los datos que hoy no se muestran (introducción, seguridad, plano) siguen
/// en el código. Las actividades de una ficha van en el mismo orden que en el código.

export type FichaEditable = {
  title: string
  kicker: string
  summary: string
  banner: FotoConTexto
  subactivities: { name: string; chip: string; how: string; photos: { foto: FotoConTexto }[] }[]
}

const foto = (src: string, alt: string): FotoConTexto => ({ src, alt })

export function fichaDe(ficha: Category): FichaEditable {
  return {
    title: ficha.title,
    kicker: ficha.kicker,
    summary: ficha.summary,
    banner: foto(ficha.banner.src, ficha.banner.alt),
    subactivities: ficha.subactivities.map((item) => ({ name: item.name, chip: item.chip, how: item.how, photos: item.photos.map((photo) => ({ foto: foto(photo.src, photo.alt) })) })),
  }
}

const texto = (clave: string, etiqueta: string, max: number, extra: Partial<Extract<Campo, { tipo: "texto" }>> = {}): Campo => ({ tipo: "texto", clave, etiqueta, max, ...extra })
const fotoCampo = (clave: string, etiqueta: string): Campo => ({ tipo: "foto", clave, etiqueta })

export function camposDeFicha(ficha: Category): Campo[] {
  return [
    texto("title", "Título", 60),
    texto("kicker", "Antetítulo", 30, { ayuda: "La palabra chica arriba del título (Agua, Altura...)." }),
    texto("summary", "Resumen", 200, { multilinea: true, ayuda: "Va debajo del título y en las listas de fichas." }),
    fotoCampo("banner", "Foto principal"),
    {
      tipo: "lista",
      clave: "subactivities",
      etiqueta: "Actividades de la ficha",
      ayuda: "Cada una tiene su lugar en la página y su enlace, por eso no se agregan ni se quitan desde acá.",
      item: "Actividad",
      min: ficha.subactivities.length,
      max: ficha.subactivities.length,
      fija: true,
      nombres: ficha.subactivities.map((item) => item.name),
      campos: [
        texto("name", "Nombre", 60),
        texto("chip", "Etiqueta corta", 40, { ayuda: "La que aparece en las tarjetas del inicio y en la lista de fichas." }),
        texto("how", "Cómo es", 900, { multilinea: true }),
        { tipo: "lista", clave: "photos", etiqueta: "Fotos", ayuda: "Se muestran hasta 4. Si hay menos, se completan con otras fotos de la ficha.", item: "Foto", min: 1, max: Math.max(4, ...ficha.subactivities.map((item) => item.photos.length)), campos: [fotoCampo("foto", "Foto")] },
      ],
    },
  ]
}

/// La ficha del código con lo editado encima. El encuadre de una foto se conserva solo si
/// sigue siendo la misma foto: una nueva va centrada.
export function aplicarFicha(ficha: Category, editada: FichaEditable | undefined): Category {
  if (!editada) return ficha
  const encuadre = (original: { src: string; position?: string }, nueva: FotoConTexto) => ({
    src: nueva.src,
    alt: nueva.alt,
    position: nueva.src === original.src ? original.position : undefined,
  })
  return {
    ...ficha,
    title: editada.title,
    kicker: editada.kicker,
    summary: editada.summary,
    banner: encuadre(ficha.banner, editada.banner),
    subactivities: ficha.subactivities.map((item, indice) => {
      const nueva = editada.subactivities[indice]
      if (!nueva) return item
      return {
        ...item,
        name: nueva.name,
        chip: nueva.chip,
        how: nueva.how,
        photos: nueva.photos.map(({ foto: elegida }) => encuadre(item.photos.find((photo) => photo.src === elegida.src) ?? { src: "" }, elegida)),
      }
    }),
  }
}

export const fichasDeActividades = categories
export const fichasDeEstadias = stays

const tarjetasDelInicio: { slug: string; side: "left" | "right"; stay?: boolean; title?: string }[] = [
  { slug: "lago", side: "left" },
  { slug: "parque-aereo", side: "right" },
  { slug: "canchas", side: "left" },
  { slug: "playa", side: "right" },
  { slug: "parrillas", side: "left" },
  { slug: "bar", side: "right" },
  { slug: "bungalows", side: "left", stay: true },
  { slug: "campamento", side: "right", stay: true, title: "Propuestas estudiantiles" },
]

/// Las tarjetas de actividades del inicio, con el título, la foto y las etiquetas de cada ficha.
export function tarjetasDeActividades(actividades: Category[], estadias: Category[]) {
  return tarjetasDelInicio.flatMap(({ slug, side, stay, title }) => {
    const item = (stay ? estadias : actividades).find((ficha) => ficha.slug === slug)
    if (!item) return []
    return [
      {
        title: title ?? item.title,
        chips: item.subactivities.map((sub) => sub.chip),
        image: item.banner.src,
        href: stay ? `/estadia/${slug}` : `/categorias/${slug}`,
        side,
        position: slug === "parrillas" ? item.banner.position : undefined,
        compact: stay,
      },
    ]
  })
}
