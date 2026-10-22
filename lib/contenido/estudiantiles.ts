import type { Campo } from "@/lib/contenido/campos"
import { seccionesEstudiantiles, type ItemEstudiantil, type SeccionEstudiantil } from "@/lib/propuestas"

/// Cada propuesta estudiantil se edita aparte: tarifas, comidas, lo que incluye y las
/// condiciones. El identificador y el número quedan en el código: los usa la reserva.

type Texto = { texto: string }

export type PropuestaEstudiantilEditable = {
  nombre: string
  titulo: string
  horario: string
  cierre: string
  incluye: Texto[]
  aviso: string
  comidas: { dia: string; comidas: { momento: string; detalle: string }[] }[]
  notaComidas: string
  tarifas: { concepto: string; importe: string; cuotas: string; efectivo: string; cuotasEfectivo: string }[]
  condiciones: Texto[]
  notas: Texto[]
}

export const propuestasEstudiantiles = seccionesEstudiantiles.flatMap((seccion) => seccion.propuestas.map((propuesta) => ({ seccion, propuesta })))

const textos = (lista: string[]) => lista.map((texto) => ({ texto }))

export function propuestaEstudiantilDe(propuesta: ItemEstudiantil): PropuestaEstudiantilEditable {
  const { ficha } = propuesta
  return {
    nombre: propuesta.nombre,
    titulo: propuesta.titulo,
    horario: propuesta.horario,
    cierre: ficha.cierre,
    incluye: textos(ficha.incluye),
    aviso: ficha.aviso ?? "",
    comidas: (ficha.comidas ?? []).map((dia) => ({ dia: dia.dia, comidas: dia.comidas.map(({ momento, detalle }) => ({ momento, detalle })) })),
    notaComidas: ficha.notaComidas ?? "",
    tarifas: ficha.tarifas.map(({ concepto, importe, cuotas, efectivo, cuotasEfectivo }) => ({ concepto, importe, cuotas, efectivo, cuotasEfectivo })),
    condiciones: textos(ficha.condiciones),
    notas: textos(ficha.notas),
  }
}

const texto = (clave: string, etiqueta: string, max: number, extra: Partial<Extract<Campo, { tipo: "texto" }>> = {}): Campo => ({ tipo: "texto", clave, etiqueta, max, ...extra })
const listaDeTextos = (clave: string, etiqueta: string, item: string, min: number, extra: Partial<Extract<Campo, { tipo: "lista" }>> = {}): Campo => ({
  tipo: "lista",
  clave,
  etiqueta,
  item,
  min,
  max: 20,
  campos: [texto("texto", "Texto", 400, { multilinea: true })],
  ...extra,
})

export const camposDePropuestaEstudiantil: Campo[] = [
  texto("nombre", "Nombre corto", 80, { ayuda: "El que aparece en la lista de propuestas." }),
  texto("titulo", "Título", 120),
  texto("horario", "Horario", 80, { ayuda: "Aparece debajo del nombre, por ejemplo «Termina a las 16.30»." }),
  texto("cierre", "Apertura y cierre", 200, { multilinea: true }),
  listaDeTextos("incluye", "Qué incluye", "Ítem", 1),
  texto("aviso", "Aviso destacado", 200, { multilinea: true, opcional: true, ayuda: "Opcional. Por ejemplo, que las carpas las trae el grupo." }),
  {
    tipo: "lista",
    clave: "tarifas",
    etiqueta: "Tarifas",
    ayuda: "Escribí los importes como se muestran, con el signo $. Si se deja sin tarifas, la propuesta dice que se cotiza por consulta.",
    item: "Tarifa",
    min: 0,
    max: 6,
    titulo: "concepto",
    campos: [
      texto("concepto", "Para quién o cuándo", 80),
      texto("importe", "Precio", 30),
      texto("cuotas", "En cuotas", 60),
      texto("efectivo", "Precio en efectivo", 30),
      texto("cuotasEfectivo", "En cuotas, efectivo", 60),
    ],
  },
  {
    tipo: "lista",
    clave: "comidas",
    etiqueta: "Comidas",
    ayuda: "Sin días, la propuesta no muestra el menú.",
    item: "Día",
    min: 0,
    max: 4,
    titulo: "dia",
    campos: [
      texto("dia", "Día", 40, { opcional: true, ayuda: "Vacío si es una sola jornada." }),
      { tipo: "lista", clave: "comidas", etiqueta: "Comidas del día", item: "Comida", min: 1, max: 6, titulo: "momento", campos: [texto("momento", "Momento", 30), texto("detalle", "Menú", 200, { multilinea: true })] },
    ],
  },
  texto("notaComidas", "Nota del menú", 200, { multilinea: true, opcional: true }),
  listaDeTextos("condiciones", "Condiciones de la reserva", "Condición", 0),
  listaDeTextos("notas", "Notas (docentes, extras)", "Nota", 0),
]

export function aplicarPropuestaEstudiantil(propuesta: ItemEstudiantil, editada: PropuestaEstudiantilEditable | undefined): ItemEstudiantil {
  if (!editada) return propuesta
  return {
    ...propuesta,
    nombre: editada.nombre,
    titulo: editada.titulo,
    horario: editada.horario,
    ficha: {
      cierre: editada.cierre,
      incluye: editada.incluye.map((item) => item.texto),
      aviso: editada.aviso || undefined,
      comidas: editada.comidas.length ? editada.comidas : undefined,
      notaComidas: editada.notaComidas || undefined,
      tarifas: editada.tarifas,
      condiciones: editada.condiciones.map((item) => item.texto),
      notas: editada.notas.map((item) => item.texto),
    },
  }
}

export function seccionesEstudiantilesCon(editadas: Record<string, PropuestaEstudiantilEditable>): SeccionEstudiantil[] {
  return seccionesEstudiantiles.map((seccion) => ({ ...seccion, propuestas: seccion.propuestas.map((propuesta) => aplicarPropuestaEstudiantil(propuesta, editadas[propuesta.id])) }))
}
