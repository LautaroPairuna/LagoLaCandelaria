import type { Campo } from "@/lib/contenido/campos"
import { camposDePropuestaEstudiantil, propuestaEstudiantilDe, propuestasEstudiantiles, type PropuestaEstudiantilEditable } from "@/lib/contenido/estudiantiles"
import { camposDeFicha, fichaDe, fichasDeActividades, fichasDeEstadias, type FichaEditable } from "@/lib/contenido/fichas"
import { contenidoPorDefecto, secciones, type ClaveFija, type SeccionesFijas } from "@/lib/contenido/secciones"

/// Todas las secciones editables: las fijas, una por ficha de actividad o estadía y una
/// por propuesta estudiantil. La clave de cada una es la fila de la tabla `contenidos`.

export const grupos = {
  general: "Generales",
  actividades: "Fichas de actividades",
  estadias: "Fichas de estadías",
  estudiantiles: "Propuestas estudiantiles",
} as const

export type Grupo = keyof typeof grupos

export type Definicion = { clave: string; nombre: string; descripcion: string; grupo: Grupo; campos: Campo[]; porDefecto: unknown; dondeSeVe: string }

const dondeSeVeFija: Record<ClaveFija, string> = {
  contacto: "/#contacto",
  inicio: "/",
  propuestas: "/#como-reservar",
  paginas: "/actividades",
  reglamentos: "/reglamento/finde",
  resenas: "/#ubicacion",
}

export const registro: Definicion[] = [
  ...(Object.keys(secciones) as ClaveFija[]).map((clave) => ({
    clave,
    ...secciones[clave],
    grupo: "general" as const,
    porDefecto: contenidoPorDefecto[clave],
    dondeSeVe: dondeSeVeFija[clave],
  })),
  ...[...fichasDeActividades.map((ficha) => ({ ficha, grupo: "actividades" as const, ruta: "categorias" })), ...fichasDeEstadias.map((ficha) => ({ ficha, grupo: "estadias" as const, ruta: "estadia" }))].map(({ ficha, grupo, ruta }) => ({
    clave: `ficha-${ficha.slug}`,
    nombre: ficha.title,
    descripcion: ficha.summary,
    grupo,
    campos: camposDeFicha(ficha),
    porDefecto: fichaDe(ficha),
    dondeSeVe: `/${ruta}/${ficha.slug}`,
  })),
  ...propuestasEstudiantiles.map(({ seccion, propuesta }) => ({
    clave: `estudiantil-${propuesta.id}`,
    nombre: `${propuesta.numero}. ${propuesta.titulo}`,
    descripcion: `${seccion.nombre}: tarifas, comidas, qué incluye y condiciones.`,
    grupo: "estudiantiles" as const,
    campos: camposDePropuestaEstudiantil,
    porDefecto: propuestaEstudiantilDe(propuesta),
    dondeSeVe: `/?propuesta=estudiantil&opcion=${propuesta.id}#como-reservar`,
  })),
]

const porClave = new Map(registro.map((definicion) => [definicion.clave, definicion]))

export function definicionDe(clave: unknown) {
  return typeof clave === "string" ? porClave.get(clave) : undefined
}

export type ContenidoDelSitio = SeccionesFijas & {
  fichas: Record<string, FichaEditable>
  estudiantiles: Record<string, PropuestaEstudiantilEditable>
  porClave: Record<string, unknown>
}

/// Arma el contenido con lo que haya de cada sección (lo guardado o lo de fábrica).
export function armarContenido(valores: Map<string, unknown>): ContenidoDelSitio {
  const contenido = { ...contenidoPorDefecto, fichas: {}, estudiantiles: {}, porClave: {} } as ContenidoDelSitio
  for (const definicion of registro) {
    const valor = valores.get(definicion.clave) ?? definicion.porDefecto
    contenido.porClave[definicion.clave] = valor
    if (definicion.clave.startsWith("ficha-")) contenido.fichas[definicion.clave.slice("ficha-".length)] = valor as FichaEditable
    else if (definicion.clave.startsWith("estudiantil-")) contenido.estudiantiles[definicion.clave.slice("estudiantil-".length)] = valor as PropuestaEstudiantilEditable
    else Object.assign(contenido, { [definicion.clave]: valor })
  }
  return contenido
}
