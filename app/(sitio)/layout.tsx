import { ProveedorDeContenido } from "@/components/contenido-del-sitio"
import { DatosEstructurados } from "@/components/datos-estructurados"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { contenidoDelSitio } from "@/lib/contenido/leer"

export default async function SitioLayout({ children }: LayoutProps<"/">) {
  const contenido = await contenidoDelSitio()
  return (
    <ProveedorDeContenido contenido={contenido}>
      <DatosEstructurados contacto={contenido.contacto} />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter inicio={contenido.inicio} />
    </ProveedorDeContenido>
  )
}
