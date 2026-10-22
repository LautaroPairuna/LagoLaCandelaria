import type { Modulo } from "@/generated/prisma/enums"

/// Reglamentos del predio según el tipo de reserva, tal como los pasó el predio. Se
/// muestran en el ticket y en /reglamento/<tipo>, que es lo que se comparte por WhatsApp
/// con todo el grupo.

export type TipoDeReglamento = "finde" | "bungalow" | "nado"

export type Reglamento = { titulo: string; reglas: string[]; parrafos: string[]; conHorarios: boolean }

const guardavidas = "El guardavidas es la autoridad máxima a efectos de salvaguardar la integridad física de los bañistas y hacer cumplir el reglamento."
const parlantes = "Prohibido el uso de parlantes portátiles."
const futbol = "Está prohibido jugar al fútbol en el sector de mesas, parrillas y quinchos: deben jugar en la cancha de fútbol."
const nadarEnElLago =
  "Está permitido nadar en el lago solamente con supervisión de nuestros guardavidas y con elemento de flotación (sólo nadadores). Diríjanse al muelle para coordinar horario y sector para salir a nadar (a veces hay varios grupos)."
const trajeDeBano = "Es obligatorio el uso de traje de baño tanto en el lago como en la piscina (no con bermudas, pantalones, remeras, etc.)."
const ninos = "Niños siempre acompañados por un adulto."
const vidrio = "No está permitido utilizar botellas y vasos de vidrio en el sector playa."
const instructores = "Está prohibida la utilización de todas las actividades sin la presencia de los instructores y sin las medidas de seguridad."
const sanitarios = "Está prohibido ingresar a los sanitarios o al SUM con el torso desnudo."

const restricciones =
  "En las actividades de kayak, tirolesa, puentes aéreos, palestra y circuito de juegos inflables, el personal está autorizado a restringir el acceso completo o parcial, a su criterio, por limitaciones físicas o de movilidad, altura, edad o sobrepeso."
const convivencia = "Se recomienda el decoro y las buenas costumbres para preservar la convivencia. Es responsabilidad de los bañistas cuidar la higiene y preservar los bienes del predio."
const admision = "En caso de incumplir alguno de los puntos detallados anteriormente no podrá permanecer en el sector. La casa se reserva el derecho de admisión."

export const reglamentos: Record<TipoDeReglamento, Reglamento> = {
  finde: {
    titulo: "Reglamento del predio",
    reglas: [
      "El horario es de 10 a 19 hs.",
      guardavidas,
      parlantes,
      futbol,
      "Los perros de tamaño pequeño pueden ingresar, pero deben permanecer siempre con correa.",
      nadarEnElLago,
      trajeDeBano,
      ninos,
      vidrio,
      instructores,
      sanitarios,
    ],
    parrafos: [restricciones, convivencia, admision],
    conHorarios: true,
  },
  bungalow: {
    titulo: "Reglamento de los bungalows",
    reglas: [
      "El check in es a las 10 hs y el check out, hasta las 18 hs del segundo día.",
      guardavidas,
      "No está permitido el ingreso de parlantes ni de mascotas.",
      futbol,
      nadarEnElLago,
      trajeDeBano,
      ninos,
      vidrio,
      instructores,
      sanitarios,
      "No incluye ropa blanca (sábanas y toallas).",
      "El comedor es compartido, con heladera.",
      "Hay parrillas para hacer asado.",
      "El desayuno se sirve en el restaurante, de 9 a 10 hs.",
      "Cuando se retiran (check out), dejen la llave adentro del bungalow.",
    ],
    parrafos: [restricciones, convivencia, admision],
    conHorarios: true,
  },
  nado: {
    titulo: "Reglamento para nado en aguas abiertas",
    reglas: [
      "Está permitido nadar solamente con supervisión de nuestro staff (guardavidas) y sólo para nadadores.",
      "Cada uno nada lo que desea dentro del circuito indicado por el guardavidas a cargo de La Candelaria.",
      "Ni bien ingresan, diríjanse al muelle para coordinar con los guardavidas el horario y el sector para salir a nadar (puede haber varios grupos u otros nadadores).",
      "Traigan elemento de flotación. Si no tienen, se lo prestamos.",
      "La tarifa incluye solo el nado en aguas abiertas, no el resto de las actividades del predio.",
    ],
    parrafos: [convivencia, admision],
    conHorarios: false,
  },
}

/// El horario de actividades que se manda a quienes reservan finde en familia o bungalow.
export const horarioDeActividades: { actividad: string; horario: string; nota?: string }[] = [
  { actividad: "Puente aéreo (para niños)", horario: "De 11 a 13 hs y de 17 a 18 hs", nota: "Obligatorio zapatillas." },
  { actividad: "Palestra", horario: "De 11 a 13 hs y de 17 a 18 hs", nota: "Obligatorio zapatillas." },
  { actividad: "Piscina con juegos acuáticos", horario: "De 11 a 18 hs" },
  { actividad: "Remo", horario: "De 11 a 17 hs", nota: "Diríjanse al muelle para anotarse antes de las 13 hs: se reserva horario y embarcación." },
  { actividad: "Tirolesa (1 pasada, intransferible)", horario: "De 15 a 16.30 hs", nota: "Hacer fila en el mangrullo." },
  { actividad: "Puente aéreo (para adultos)", horario: "De 16.30 a 18 hs", nota: "Obligatorio zapatillas." },
  { actividad: "Duchas", horario: "De 17 a 18.30 hs" },
]

export const HORARIO_DEL_PREDIO = "De 10 a 19 hs"

export function reglamentoDe(modulo: Modulo): TipoDeReglamento | null {
  if (modulo === "FINDE_FAMILIA") return "finde"
  if (modulo === "BUNGALOW") return "bungalow"
  if (modulo === "NADO") return "nado"
  return null
}

export function esTipoDeReglamento(valor: string): valor is TipoDeReglamento {
  return valor in reglamentos
}

/// El texto que el titular reenvía a su grupo por WhatsApp.
export function mensajeParaElGrupo(tipo: TipoDeReglamento, fecha: string, enlace: string, horario = HORARIO_DEL_PREDIO) {
  const horarioEnLaFrase = horario.charAt(0).toLowerCase() + horario.slice(1)
  return `¡Hola! Tenemos reserva en Lago La Candelaria el ${fecha}. El horario del predio es ${horarioEnLaFrase}. Acá está el reglamento${reglamentos[tipo].conHorarios ? " y los horarios de las actividades" : ""}, leanlo antes de ir: ${enlace}`
}
