import type { Modulo } from "@/generated/prisma/enums"

export type Opcion = {
  id: string
  nombre: string
  detalle: string
  foto: string
  flujo: "dia" | "bungalow" | "grupo" | "whatsapp"
  lugar?: "parrilla" | "playa" | "restaurante"
  modulo?: Modulo
  modalidad?: string
}

export type Propuesta = { id: "familia" | "estudiantil" | "aventura"; nombre: string; detalle: string; foto: string; opciones: Opcion[] }

export const propuestas: Propuesta[] = [
  {
    id: "familia",
    nombre: "Finde en familia",
    detalle: "Pasar el día con parrilla o en la playa, o quedarse en un bungalow.",
    foto: "/covers/playa.jpg",
    opciones: [
      { id: "parrilla", nombre: "Parrilla", detalle: "Banco de madera con parrilla para el día. Más de 18 personas, quincho.", foto: "/covers/parrillas.jpg", flujo: "dia", lugar: "parrilla" },
      { id: "playa", nombre: "Gazebo o palapa", detalle: "Sombra en la playa, junto al agua. Según el grupo, uno, dos o tres lugares.", foto: "/covers/playa.jpg", flujo: "dia", lugar: "playa" },
      { id: "bungalow", nombre: "Bungalow", detalle: "Alojamiento por noche para hasta 4 personas por bungalow.", foto: "/bungalow.jpg", flujo: "bungalow" },
      { id: "restaurante", nombre: "Restaurante", detalle: "Mesa en el restaurante del predio en el horario que elijan, para 2, 4 o 6 personas o varias juntas. Se paga lo que consumen.", foto: "/covers/restaurante.jpg", flujo: "dia", lugar: "restaurante" },
    ],
  },
  {
    id: "estudiantil",
    nombre: "Propuesta estudiantil",
    detalle: "Campamento, dormitorios o jornada. Elegí una propuesta y después cargá los datos del grupo.",
    foto: "/covers/grupos-estudiantiles.jpg",
    opciones: [
      { id: "campamento", nombre: "Campamento", detalle: "Jornada de aventura, carpa o dormis para grupos de colegio.", foto: "/covers/campamento.jpg", flujo: "grupo", modulo: "CAMPAMENTO" },
      { id: "salida", nombre: "Salida educativa", detalle: "Visitas guiadas y actividades didácticas en el predio.", foto: "/covers/canchas.jpg", flujo: "grupo", modulo: "SALIDA_EDUCATIVA" },
      { id: "egresados", nombre: "Viaje de egresados", detalle: "Paquetes para grupos de fin de curso.", foto: "/covers/parque-aereo.jpg", flujo: "grupo", modulo: "VIAJE_EGRESADOS" },
    ],
  },
  {
    id: "aventura",
    nombre: "Actividad de aventura",
    detalle: "Carreras de nado, kayak, senderismo y tirolesa para clubes y grupos.",
    foto: "/covers/lago.jpg",
    opciones: [
      { id: "nado", nombre: "Carreras de nado", detalle: "Competencias y pruebas en el agua.", foto: "/lago.jpg", flujo: "grupo", modulo: "ACTIVIDAD_AVENTURA", modalidad: "Carreras de nado" },
      { id: "kayak", nombre: "Kayak y canotaje", detalle: "Travesías y actividades náuticas guiadas.", foto: "/covers/lago.jpg", flujo: "grupo", modulo: "ACTIVIDAD_AVENTURA", modalidad: "Kayak y canotaje" },
      { id: "senderismo", nombre: "Senderismo y tirolesa", detalle: "Recorridos, trekking y canopy por el predio.", foto: "/covers/parque-aereo.jpg", flujo: "grupo", modulo: "ACTIVIDAD_AVENTURA", modalidad: "Senderismo y tirolesa" },
    ],
  },
]

export type TarifaEstudiantil = {
  concepto: string
  importe: string
  cuotas: string
  efectivo: string
  cuotasEfectivo: string
}

export type ComidaEstudiantil = { momento: string; detalle: string }

export type FichaEstudiantil = {
  cierre: string
  incluye: string[]
  comidas?: { dia: string; comidas: ComidaEstudiantil[] }[]
  notaComidas?: string
  aviso?: string
  condiciones: string[]
  tarifas: TarifaEstudiantil[]
  notas: string[]
}

const actividades =
  "Caminata interpretativa, tirolesa, puentes colgantes, escalada y remo. Las coordina el staff y se adaptan a la edad del grupo. Los horarios se pautan ese día."

const verano = "En verano, pileta y juegos inflables."

const condicionesDeReserva = [
  "Para efectivizar la reserva y congelar el precio se abona el 50 % al reservar: en temporada baja, y en temporada alta antes del receso invernal.",
  "No se dan fechas alternativas. Si se suspende por fuerza mayor, las dos partes coordinan una nueva fecha.",
]

const notasDeDocentes = ["Cada 12 alumnos se libera un docente.", "Cada docente extra abona el 70 % del valor."]

const notaDeMenu = "Hay menú para celíacos y vegetarianos. Las comidas se sirven en los quinchos o en el salón comedor."

const carpasPropias = "Las carpas no las provee Lago La Candelaria."

function tarifa(concepto: string, importe: string, cuotas: string, efectivo: string, cuotasEfectivo: string): TarifaEstudiantil {
  return { concepto, importe, cuotas, efectivo, cuotasEfectivo }
}

function cierreJornada(hora: string) {
  return `El complejo abre a las 9.00. La jornada termina a las ${hora}.`
}

const comidasDelDia: ComidaEstudiantil[] = [
  { momento: "Desayuno", detalle: "Infusión (té, café o mate cocido) y 2 medialunas." },
  { momento: "Almuerzo", detalle: "Hamburguesas con lechuga y tomate, papas fritas y gaseosa o jugo. Postre: helado de agua." },
  { momento: "Merienda", detalle: "Chocolatada con galletitas surtidas." },
]

const primerDiaConCena: ComidaEstudiantil[] = [
  { momento: "Desayuno", detalle: "Infusión (té, café o mate cocido) y 2 medialunas." },
  { momento: "Almuerzo", detalle: "Hamburguesas con lechuga y tomate, papas fritas y gaseosa o jugo. Postre: frutas." },
  { momento: "Merienda", detalle: "Chocolatada con galletitas surtidas." },
  { momento: "Cena", detalle: "Pizza con jugo. Postre: helado de agua." },
]

const segundoDia: ComidaEstudiantil[] = [
  { momento: "Desayuno", detalle: "Infusión (té, café o mate cocido) y pan con dulce." },
  { momento: "Almuerzo", detalle: "Carne al horno con puré, gaseosa o jugo. Postre: gelatina." },
  { momento: "Merienda", detalle: "Chocolatada con vainillas." },
]

const segundoDiaConCena: ComidaEstudiantil[] = [
  ...segundoDia,
  { momento: "Cena", detalle: "Fideos a la boloñesa con jugo. Postre: mousse de chocolate." },
]

const tercerDia: ComidaEstudiantil[] = [
  { momento: "Desayuno", detalle: "Infusión (té, café o mate cocido) y pan con dulce." },
  { momento: "Almuerzo", detalle: "Suprema con ensalada y jugo. Postre: fruta." },
  { momento: "Merienda", detalle: "Chocolatada con bizcochuelo." },
]

const cierreSegundoDia = "El complejo abre a las 9.00. El campamento termina el segundo día a las 16.30."
const cierreTercerDia = "El complejo abre a las 9.00. El campamento termina el tercer día a las 16.30."
const horarioSegundo = "Termina el segundo día a las 16.30"
const horarioTercer = "Termina el tercer día a las 16.30"

const enCarpa = ["Quincho con parrilla.", "Sector para armar las carpas.", "Uso del sector de fogón."]
const enDormis = ["Quincho con parrilla.", "Sector de dormis para 48 alumnos.", "Uso del sector de fogón."]

export type ItemEstudiantil = {
  id: string
  numero: string
  nombre: string
  titulo: string
  horario: string
  ficha: FichaEstudiantil
}

export type SeccionEstudiantil = {
  id: "campamento" | "dormitorios" | "jornada"
  nombre: string
  propuestas: ItemEstudiantil[]
}

const tarifasDosDias = [
  tarifa("Por alumno", "$ 121.000", "dos cuotas de $ 61.500", "$ 110.000", "dos cuotas de $ 55.000"),
  tarifa("Temporada baja, hasta el 30 de agosto", "$ 83.000", "dos cuotas de $ 41.500", "$ 75.000", "dos cuotas de $ 35.000"),
]

const tarifasTresDias = [
  tarifa("Por alumno", "$ 198.000", "dos cuotas de $ 99.000", "$ 180.000", "dos cuotas de $ 90.000"),
  tarifa("Temporada baja, hasta el 30 de agosto", "$ 138.000", "dos cuotas de $ 69.000", "$ 125.000", "dos cuotas de $ 62.500"),
]

const comidasTresDias = [
  { dia: "Primer día", comidas: primerDiaConCena },
  { dia: "Segundo día", comidas: segundoDiaConCena },
  { dia: "Tercer día", comidas: tercerDia },
]

function item(
  id: string,
  numero: string,
  nombre: string,
  titulo: string,
  horario: string,
  ficha: Partial<FichaEstudiantil> & Pick<FichaEstudiantil, "cierre" | "incluye">,
): ItemEstudiantil {
  return {
    id,
    numero,
    nombre,
    titulo,
    horario,
    ficha: {
      condiciones: condicionesDeReserva,
      tarifas: tarifasDosDias,
      notas: notasDeDocentes,
      ...ficha,
    },
  }
}

export const seccionesEstudiantiles: SeccionEstudiantil[] = [
  {
    id: "campamento",
    nombre: "Campamento",
    propuestas: [
      item("campamento-5", "5", "2 días y 1 noche en carpa", "Campamento de aventura, 2 días y 1 noche en carpa", horarioSegundo, {
        cierre: cierreSegundoDia,
        incluye: [actividades, verano, ...enCarpa],
        aviso: carpasPropias,
      }),
      item("campamento-7", "7", "2 días y 1 noche en carpa, pensión completa", "Campamento de aventura, 2 días y 1 noche en carpa, pensión completa", horarioSegundo, {
        cierre: cierreSegundoDia,
        incluye: [actividades, verano, ...enCarpa],
        comidas: [
          { dia: "Primer día", comidas: primerDiaConCena },
          { dia: "Segundo día", comidas: segundoDia },
        ],
        notaComidas: notaDeMenu,
        aviso: carpasPropias,
        tarifas: [
          tarifa("Por alumno", "$ 250.000", "dos cuotas de $ 125.000", "$ 210.000", "dos cuotas de $ 105.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 165.000", "dos cuotas de $ 82.500", "$ 150.000", "dos cuotas de $ 75.000"),
        ],
      }),
      item("campamento-9", "9", "3 días y 2 noches en carpa", "Campamento de aventura, 3 días y 2 noches en carpa", horarioTercer, {
        cierre: cierreTercerDia,
        incluye: [actividades, verano, ...enCarpa],
        aviso: carpasPropias,
        tarifas: tarifasTresDias,
      }),
      item("campamento-11", "11", "3 días y 2 noches en carpa, pensión completa", "Campamento de aventura, 3 días y 2 noches en carpa, pensión completa", horarioTercer, {
        cierre: cierreTercerDia,
        incluye: [actividades, verano, ...enCarpa],
        comidas: comidasTresDias,
        notaComidas: notaDeMenu,
        aviso: carpasPropias,
        tarifas: [],
      }),
    ],
  },
  {
    id: "dormitorios",
    nombre: "Dormitorios",
    propuestas: [
      item("dormitorios-6", "6", "2 días y 1 noche en dormis", "Campamento de aventura, 2 días y 1 noche en dormis", horarioSegundo, {
        cierre: cierreSegundoDia,
        incluye: [actividades, verano, ...enDormis],
      }),
      item("dormitorios-8", "8", "2 días y 1 noche en dormis, pensión completa", "Campamento de aventura, 2 días y 1 noche en dormis, pensión completa", horarioSegundo, {
        cierre: cierreSegundoDia,
        incluye: [actividades, verano, "Uso del sector de fogón."],
        comidas: [
          { dia: "Primer día", comidas: primerDiaConCena },
          { dia: "Segundo día", comidas: segundoDia },
        ],
        notaComidas: notaDeMenu,
        tarifas: [
          tarifa("Por alumno", "$ 253.000", "dos cuotas de $ 126.500", "$ 230.000", "dos cuotas de $ 115.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 188.000", "dos cuotas de $ 94.000", "$ 170.000", "dos cuotas de $ 85.000"),
        ],
      }),
      item("dormitorios-10", "10", "3 días y 2 noches en dormis", "Campamento de aventura, 3 días y 2 noches en dormis", horarioTercer, {
        cierre: cierreTercerDia,
        incluye: [actividades, verano, ...enDormis],
        tarifas: tarifasTresDias,
      }),
      item("dormitorios-12", "12", "3 días y 2 noches en dormis, pensión completa", "Campamento de aventura, 3 días y 2 noches en dormis, pensión completa", horarioTercer, {
        cierre: cierreTercerDia,
        incluye: [actividades, verano, "Uso del sector de fogón."],
        comidas: comidasTresDias,
        notaComidas: notaDeMenu,
        tarifas: [],
      }),
    ],
  },
  {
    id: "jornada",
    nombre: "Jornada",
    propuestas: [
      item("jornada-1", "1", "Día de aventura", "Jornada de aventura", "Termina a las 16.30", {
        cierre: cierreJornada("16.30"),
        incluye: [actividades, verano],
        aviso: "Las fechas de temporada alta se otorgan a partir del 1° de abril.",
        tarifas: [
          tarifa("Por alumno", "$ 44.000", "dos cuotas de $ 22.000", "$ 40.000", "dos cuotas de $ 20.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 27.500", "dos cuotas de $ 15.000", "$ 25.000", "dos cuotas de $ 12.500"),
        ],
      }),
      item("jornada-2", "2", "Día con pensión completa", "Jornada de aventura con pensión completa", "Termina a las 16.30", {
        cierre: cierreJornada("16.30"),
        incluye: [actividades, verano],
        comidas: [{ dia: "", comidas: comidasDelDia }],
        notaComidas: notaDeMenu,
        tarifas: [
          tarifa("Por alumno", "$ 88.000", "dos cuotas de $ 44.000", "$ 80.000", "dos cuotas de $ 40.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 61.600", "dos cuotas de $ 30.000", "$ 56.000", "dos cuotas de $ 28.000"),
        ],
      }),
      item("jornada-3", "3", "Día con fogón", "Jornada de aventura con fogón", "Termina a las 19.30", {
        cierre: cierreJornada("19.30"),
        incluye: [actividades, verano, "Uso del sector de fogón."],
        tarifas: [
          tarifa("Por alumno", "$ 62.000", "dos cuotas de $ 31.000", "$ 56.000", "dos cuotas de $ 28.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 40.000", "dos cuotas de $ 20.000", "$ 36.000", "dos cuotas de $ 18.000"),
        ],
      }),
      item("jornada-4", "4", "Día con pensión completa y fogón", "Jornada de aventura con pensión completa y fogón", "Termina a las 21.30", {
        cierre: cierreJornada("21.30"),
        incluye: [actividades, verano, "Uso del sector de fogón."],
        comidas: [{ dia: "", comidas: primerDiaConCena }],
        notaComidas: notaDeMenu,
        tarifas: [
          tarifa("Por alumno", "$ 128.000", "dos cuotas de $ 64.000", "$ 116.000", "dos cuotas de $ 58.000"),
          tarifa("Temporada baja, hasta el 30 de agosto", "$ 88.000", "dos cuotas de $ 44.000", "$ 80.000", "dos cuotas de $ 40.000"),
        ],
      }),
    ],
  },
]

export function buscarPropuestaEstudiantil(id: string | undefined) {
  if (!id) return undefined
  for (const seccion of seccionesEstudiantiles) {
    const propuesta = seccion.propuestas.find((item) => item.id === id)
    if (propuesta) return { ...propuesta, seccion: seccion.nombre }
  }
}

export function buscarPropuesta(id: string | undefined) {
  return propuestas.find((propuesta) => propuesta.id === id)
}

const visitasViejas: Record<string, [string, string?]> = {
  familia: ["familia", "parrilla"],
  bungalows: ["familia", "bungalow"],
  restaurante: ["familia", "restaurante"],
  campamento: ["estudiantil", "campamento"],
  egresados: ["estudiantil", "egresados"],
  educativa: ["estudiantil", "salida"],
}

export function destinoDeVisitaVieja(visita: string | undefined) {
  const destino = visita ? visitasViejas[visita] : undefined
  return destino ? `/reserva?propuesta=${destino[0]}${destino[1] ? `&opcion=${destino[1]}` : ""}` : null
}
