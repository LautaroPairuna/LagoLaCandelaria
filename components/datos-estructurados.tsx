import { canalesDe, telefonosDe } from "@/lib/contenido/derivados"
import type { Contacto } from "@/lib/contenido/secciones"
import { mapPoint } from "@/lib/site"
import { urlSitio } from "@/lib/url-sitio"

const redes = ["facebook", "instagram", "youtube", "tiktok"]

export function DatosEstructurados({ contacto }: { contacto: Contacto }) {
  const negocio = {
    "@type": ["LocalBusiness", "TouristAttraction"],
    "@id": `${urlSitio}/#negocio`,
    name: "Lago La Candelaria",
    inLanguage: "es-AR",
    hasMap: `https://www.google.com/maps?q=${mapPoint.lat},${mapPoint.lng}`,
    description:
      "Predio recreativo de 27 hectáreas en Tristán Suárez con canotaje, tirolesa, parque aéreo, restaurante, bungalows y campamentos estudiantiles.",
    url: urlSitio,
    image: `${urlSitio}/opengraph-image.jpg`,
    telephone: telefonosDe(contacto).map((telefono) => telefono.href.replace("tel:", "")),
    email: contacto.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tristán Suárez",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    geo: { "@type": "GeoCoordinates", latitude: mapPoint.lat, longitude: mapPoint.lng },
    sameAs: canalesDe(contacto).filter((channel) => redes.includes(channel.id)).map((channel) => channel.href),
  }
  const sitio = { "@type": "WebSite", "@id": `${urlSitio}/#sitio`, url: urlSitio, name: "Lago La Candelaria", inLanguage: "es-AR", publisher: { "@id": `${urlSitio}/#negocio` } }
  const datos = { "@context": "https://schema.org", "@graph": [negocio, sitio] }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  )
}
