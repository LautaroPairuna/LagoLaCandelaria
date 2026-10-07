import { urlSitio } from "@/lib/url-sitio"

/// Migas de pan para el buscador: de dónde viene la página dentro del sitio.
export function MigasJsonLd({ migas }: { migas: { nombre: string; ruta: string }[] }) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((miga, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: miga.nombre,
      item: `${urlSitio}${miga.ruta}`,
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />
}
