import { DatosEstructurados } from "@/components/datos-estructurados"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function SitioLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DatosEstructurados />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  )
}
