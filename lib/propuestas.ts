import type { Modulo } from "@/generated/prisma/enums"

export type Opcion = {
  id: string
  nombre: string
  detalle: string
  foto: string
  flujo: "dia" | "bungalow" | "grupo" | "whatsapp"
  lugar?: "parrilla" | "playa"
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
      { id: "restaurante", nombre: "Restaurante", detalle: "La mesa se reserva por WhatsApp, por día y franja horaria.", foto: "/covers/restaurante.jpg", flujo: "whatsapp" },
    ],
  },
  {
    id: "estudiantil",
    nombre: "Propuesta estudiantil",
    detalle: "Campamentos, salidas educativas y viajes de egresados para colegios.",
    foto: "/covers/campamento.jpg",
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
