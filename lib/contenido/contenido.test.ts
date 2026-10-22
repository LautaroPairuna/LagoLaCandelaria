import { describe, expect, it } from "vitest"

import { esquemaDe, esVideoValido } from "@/lib/contenido/campos"
import { canalesDe, enlaceWhatsapp, telefonosDe } from "@/lib/contenido/derivados"
import { registro } from "@/lib/contenido/registro"
import { contenidoPorDefecto, secciones } from "@/lib/contenido/secciones"
import { esFotoValida, fotoGenerada, fotoUrl } from "@/lib/fotos"

describe("contenido del sitio", () => {
  it.each(registro.map((definicion) => [definicion.clave, definicion] as const))("el contenido de fábrica de %s pasa su propia validación sin cambios", (_clave, definicion) => {
    expect(esquemaDe(definicion.campos).parse(definicion.porDefecto)).toEqual(definicion.porDefecto)
  })

  it("las claves entran en la columna de la tabla", () => {
    expect(Math.max(...registro.map((definicion) => definicion.clave.length))).toBeLessThanOrEqual(40)
  })

  it("arma los mismos enlaces que tenía el sitio", () => {
    const canales = Object.fromEntries(canalesDe(contenidoPorDefecto.contacto).map((canal) => [canal.id, canal.href]))
    expect(canales).toEqual({
      whatsapp: "https://wa.me/5491130091020",
      mail: "mailto:lagolacandelaria@gmail.com",
      facebook: "https://www.facebook.com/lagolacandelaria",
      instagram: "https://www.instagram.com/lagolacandelaria/",
      youtube: "https://www.youtube.com/@lagolacandelaria1482",
      phone: "tel:+541148511060",
      tiktok: "https://www.tiktok.com/@lagolacandelaria",
    })
    expect(telefonosDe(contenidoPorDefecto.contacto).map((telefono) => telefono.href)).toEqual(["tel:+541130091020", "tel:+541148511060"])
    expect(enlaceWhatsapp("11 6213-7303", "Hola")).toBe("https://wa.me/5491162137303?text=Hola")
  })

  it("rechaza teléfonos sin característica, enlaces en lugar de usuarios y textos vacíos", () => {
    const contacto = esquemaDe(secciones.contacto.campos)
    const errores = contacto.safeParse({ ...contenidoPorDefecto.contacto, whatsapp: "3009", instagram: "https://instagram.com/x", email: " " })
    expect(errores.success).toBe(false)
    const rutas = errores.error?.issues.map((problema) => problema.path.join("."))
    expect(rutas).toEqual(expect.arrayContaining(["whatsapp", "instagram", "email"]))
    expect(contacto.parse({ ...contenidoPorDefecto.contacto, instagram: "@lago.candelaria" }).instagram).toBe("lago.candelaria")
  })

  it("no deja agregar ni quitar tarjetas fijas, y exige describir cada foto", () => {
    const propuestas = esquemaDe(secciones.propuestas.campos)
    expect(propuestas.safeParse({ ...contenidoPorDefecto.propuestas, caminos: contenidoPorDefecto.propuestas.caminos.slice(1) }).success).toBe(false)
    const sinDescripcion = structuredClone(contenidoPorDefecto.propuestas)
    sinDescripcion.caminos[0].foto.alt = ""
    expect(propuestas.safeParse(sinDescripcion).error?.issues[0]?.path).toEqual(["caminos", 0, "foto", "alt"])
  })
})

describe("fotos subidas", () => {
  it("salen de su nombre las variantes y el respaldo", () => {
    const src = "/subidas/0123456789abcdef-1600x1067"
    expect(esFotoValida(src)).toBe(true)
    expect(fotoGenerada(src)).toEqual({ ancho: 1600, alto: 1067, anchos: [480, 768, 1024, 1600], base: "/subidas/0123456789abcdef", respaldo: "/subidas/0123456789abcdef-1024.jpg" })
    expect(fotoUrl(src, 900, "avif")).toBe("/subidas/0123456789abcdef-1024.avif")
  })

  it("acepta solo los videos del sitio y los subidos", () => {
    expect(esVideoValido("/hero.mp4")).toBe(true)
    expect(esVideoValido("/subidas/0123456789abcdef.mp4")).toBe(true)
    expect(esVideoValido("/subidas/0123456789abcdef.mp4?x")).toBe(false)
    expect(esVideoValido("https://otro.sitio/video.mp4")).toBe(false)
  })

  it("no acepta rutas inventadas", () => {
    expect(esFotoValida("/subidas/../../etc/passwd")).toBe(false)
    expect(esFotoValida("https://otro.sitio/foto.jpg")).toBe(false)
    expect(esFotoValida("")).toBe(false)
  })
})
