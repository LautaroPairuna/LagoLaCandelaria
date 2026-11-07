import { ProveedorDeContenido } from "@/components/contenido-del-sitio"
import { DatosEstructurados } from "@/components/datos-estructurados"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { contenidoDelSitio, seccionesEstudiantilesDelSitio } from "@/lib/contenido/leer"
import { leerPrecios } from "@/lib/precios"

export default async function SitioLayout({ children }: LayoutProps<"/">) {
  const [contenido, estudiantiles, precios] = await Promise.all([contenidoDelSitio(), seccionesEstudiantilesDelSitio(), leerPrecios()])
  return (
    <ProveedorDeContenido contenido={{ contacto: contenido.contacto, propuestas: contenido.propuestas, estudiantiles, precios }}>
      <DatosEstructurados contacto={contenido.contacto} />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter inicio={contenido.inicio} />
    </ProveedorDeContenido>
  )
}
