import { googleRating } from "@/lib/site"

export { googleRating }

export type GoogleReview = {
  name: string
  rating: number
  when: string
  text: string
}

/** Textos tomados de las opiniones públicas de Google el 28 de septiembre de 2026. */
export const googleReviews: GoogleReview[] = [
  {
    name: "aby r",
    rating: 5,
    when: "Hace 7 meses",
    text: "El lugar es grande, ideal para pasar el día en familia. Tiene varias actividades incluidas en la entrada. Tirolesa, kayak. Tiene cancha de vóley en arena, y también hay una red de vóley en una parte de las piletas. Tiene también un área de parrillas y un restaurante, la comida nos pareció no solo rica sino abundante. Podés ingresar con heladera y comida. Hay espacio tipo carpa para estar sin costo, y mesas con sombrillas alrededor de la pileta. Un lugar 10 de 10.",
  },
  {
    name: "Cecilia Muñoz",
    rating: 5,
    when: "Hace 7 meses",
    text: "Hermoso lugar, la atención, las instalaciones y actividades, quedamos encantados. Super recomendable.",
  },
  {
    name: "Abigail Villarino",
    rating: 5,
    when: "Hace 7 meses",
    text: "Hermoso lugar. Muy bien pensado y cuidado. Las actividades estan muy buenas. La gente super amable.",
  },
  {
    name: "Karen Martinez",
    rating: 4,
    when: "Hace 8 meses",
    text: "Lindo lugar, limpio, muy familiar, se mantiene el orden y la puntualidad tanto en el ingreso como en los horarios de juegos y actividades, personal amable, no se exceden en el límite de personas por lo tanto puedes disfrutar de cualquier espacio sin limitaciones, lo único que puedo sugerir es que mejoren los tragos del Bar/Restaurante y algunas reposeras. Volvería a ir sin duda.",
  },
  {
    name: "Pablo Fortunato",
    rating: 5,
    when: "Hace 8 meses",
    text: "Excelente experiencia!! Parque impecable muy enfocado al servicio de los visitantes (tienen hasta carritos para llevar las cosas del auto al predio). Tiene estacionamiento incluido y acceso a una pileta hermosa, con juegos inflables y agua transparente y cálida. Tiene zona de playa con quinchos y arena. Cancha de beach voley, tirolesa, kayak (que se practica en una especie de laguna lindera a la pileta), juegos de altura etc. Tiene un restaurante excelente y con un precio muy bueno. Los vestuarios estaban impecables. Las parrillas numeradas. Una hermosa experiencia.",
  },
  {
    name: "CECILIA ROMERO",
    rating: 5,
    when: "Hace 7 meses",
    text: "Fuimos a pasar el día, un día de semana. Nos encantó, lindo, limpio, completo. Volvería mil veces (en día de semana). El cupo es de 500 personas y ese día habría 160 aproximadamente. Lindo camino para llegar. Todo hermoso.",
  },
  {
    name: "Jorge Amer",
    rating: 5,
    when: "Hace 6 meses",
    text: "Espectacular!!! Muy limpio y bien cuidado. Super! Un espacio para la recreación. No olviden hacer reserva antes de ir.",
  },
  {
    name: "Gabriela Tripicchio",
    rating: 5,
    when: "Hace 8 meses",
    text: "Excelente lugar. Todo limpio, prolijo, muy buena atencion. El restaurante se come rico y accesible.",
  },
  {
    name: "Ayelen Garcia",
    rating: 5,
    when: "Hace 7 meses",
    text: "El lugar súper prolijo, limpio, todo señalizado, súper cuidado y la parquizacion hermosa. Las actividades súper lindas, la atención de todos los profesores espectacular. Amables y atentos.",
  },
  {
    name: "Mario Ojeda",
    rating: 5,
    when: "Hace 7 meses",
    text: "Muy lindo lugar como para descansar y disfrutar de todos los atractivos que tiene.",
  },
]
