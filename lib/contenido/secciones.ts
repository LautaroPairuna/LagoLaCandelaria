import type { Campo, FotoConTexto, VideoDeFondo } from "@/lib/contenido/campos"
import { googleReviews } from "@/lib/google-reviews"
import { HORARIO_DEL_PREDIO, horarioDeActividades, reglamentos as reglamentosDeFabrica, type TipoDeReglamento } from "@/lib/reglamentos"
import { googleRating } from "@/lib/site"

/// Las secciones del sitio que se editan desde el panel. Los valores por defecto son los
/// que el sitio tenía escritos: mientras nadie guarde una sección, se ve igual que antes.

export type Contacto = {
  whatsapp: string
  telefonoFijo: string
  email: string
  facebook: string
  instagram: string
  youtube: string
  tiktok: string
}

export type Inicio = {
  titulo: string
  actividadesTitulo: string
  subtitulo: string
  videoPortada: VideoDeFondo
  videoComoReservar: VideoDeFondo
  videoUbicacion: VideoDeFondo
  comoReservarTitulo: string
  comoReservarTexto: string
  nosotrosTitulo: string
  nosotrosTexto: string
  fotosDelEquipo: { foto: FotoConTexto }[]
  frasePie: string
  cierrePie: string
}

export type Camino = { titulo: string; detalle: string; foto: FotoConTexto }
export type Profe = { nombre: string; telefono: string }

export type Propuestas = {
  /// En el orden del recuadro: finde en familia, estudiantiles, deportes y bungalows.
  caminos: Camino[]
  /// Nado en aguas abiertas y el resto de las actividades con los profes.
  aventura: Camino[]
  profes: Profe[]
}

type Encabezado = { kicker: string; titulo: string; texto: string }
export type Paginas = { actividades: Encabezado; estadia: Encabezado; restaurante: Encabezado }

type ReglamentoEditable = { titulo: string; reglas: { texto: string }[]; parrafos: { texto: string }[] }
export type Reglamentos = Record<TipoDeReglamento, ReglamentoEditable> & {
  horarioDelPredio: string
  horarios: { actividad: string; horario: string; nota: string }[]
}

export type Resenas = { puntaje: string; cantidad: string; resenas: { name: string; rating: string; when: string; text: string }[] }

export type SeccionesFijas = { contacto: Contacto; inicio: Inicio; propuestas: Propuestas; paginas: Paginas; reglamentos: Reglamentos; resenas: Resenas }
export type ClaveFija = keyof SeccionesFijas

export const contenidoPorDefecto: SeccionesFijas = {
  contacto: {
    whatsapp: "11 3009-1020",
    telefonoFijo: "4851-1060",
    email: "lagolacandelaria@gmail.com",
    facebook: "lagolacandelaria",
    instagram: "lagolacandelaria",
    youtube: "lagolacandelaria1482",
    tiktok: "lagolacandelaria",
  },
  inicio: {
    titulo: "Aventura y descanso entre amigos y familia",
    actividadesTitulo: "Una entrada, todas las actividades",
    subtitulo: "Estamos en Tristán Suárez, a tan solo 30 minutos de Capital Federal",
    videoPortada: { src: "/hero.mp4", poster: "/posters/hero.jpg" },
    videoComoReservar: { src: "/para-quien.mp4", poster: "/posters/para-quien.jpg" },
    videoUbicacion: { src: "/ubicacion.mp4?v=5", poster: "/posters/ubicacion.jpg" },
    comoReservarTitulo: "¿Cómo reservar?",
    comoReservarTexto: "Elegí la propuesta, completá los datos y al confirmar te queda el ticket con el QR del ingreso.",
    nosotrosTitulo: "Nuestro equipo",
    nosotrosTexto:
      "Lago La Candelaria es un espacio recreativo para compartir y disfrutar de actividades de aventura y descanso con amigos, familia y grupos estudiantiles.",
    fotosDelEquipo: [
      { foto: { src: "/equipo-predio.jpg", alt: "Equipo de Lago La Candelaria en el césped del predio, con remos, frente a la casa amarilla." } },
      { foto: { src: "/equipo-palestra.jpg", alt: "Equipo de Lago La Candelaria en la palestra, sobre la colchoneta roja." } },
      { foto: { src: "/equipo-juegos.jpg", alt: "Equipo de Lago La Candelaria junto a los juegos de madera del predio." } },
    ],
    frasePie: "Aventura y descanso entre amigos y familia.",
    cierrePie: "Nos vemos junto al lago.",
  },
  propuestas: {
    caminos: [
      {
        titulo: "Finde en familia",
        detalle: "Pasar el día con parrilla, gazebo o palapa, con todas las actividades incluidas.",
        foto: { src: "/covers/playa.jpg", alt: "Playa del predio." },
      },
      {
        titulo: "Propuestas estudiantiles",
        detalle: "Campamento, dormitorios o jornada. Elegí una propuesta y después cargá los datos del grupo.",
        foto: { src: "/covers/grupos-estudiantiles.jpg", alt: "Grupo en el predio." },
      },
      {
        titulo: "Deportes en la naturaleza",
        detalle: "Aguas abiertas, kayak, senderismo, trail running y escalada deportiva.",
        foto: { src: "/covers/lago.jpg", alt: "Kayak en el lago." },
      },
      {
        titulo: "Bungalows",
        detalle: "2 días y 1 noche, para hasta 4 personas por bungalow, con la entrada incluida.",
        foto: { src: "/covers/bungalows.jpg", alt: "Bungalows del predio." },
      },
    ],
    aventura: [
      {
        titulo: "Nado en aguas abiertas",
        detalle: "Elegí el día y hasta 3 horas seguidas. La tarifa incluye solo el nado, no el resto del predio.",
        foto: { src: "/activities/nado-grupo.jpg", alt: "Grupo de nadadores en el lago." },
      },
      {
        titulo: "Resto de actividades",
        detalle: "Kayak, senderismo, trail running y escalada: coordinalas con nuestros profes.",
        foto: { src: "/activities/palestra-pared.jpg", alt: "Escalada en el predio." },
      },
    ],
    profes: [
      { nombre: "Profe Santi", telefono: "11 6213-7303" },
      { nombre: "Profe Mica", telefono: "11 5103-2295" },
    ],
  },
  paginas: {
    actividades: {
      kicker: "Actividades",
      titulo: "El predio, actividad por actividad.",
      texto:
        "La entrada es una sola, al predio. Cada ficha cuenta cómo se hace: el agua, la altura, las canchas, la playa, las parrillas y la mesa. Adentro están la infraestructura, la seguridad y las variantes.",
    },
    estadia: {
      kicker: "Estadía",
      titulo: "Dormir en el predio, o pasar el día y volver.",
      texto: "Bungalows para pocos, campamento para el curso, o el día sin quedarse. Cada ficha cuenta qué incluye, dónde está en el predio y cómo sigue la reserva.",
    },
    restaurante: {
      kicker: "Restaurante",
      titulo: "La mesa también es parte del día.",
      texto:
        "Se puede comer en el predio o traer la comida y la bebida. Las dos cosas conviven. El sector —restaurante, parrilla, gazebo o bar de playa— se define cuando reservan.",
    },
  },
  reglamentos: {
    ...(Object.fromEntries(
      Object.entries(reglamentosDeFabrica).map(([tipo, reglamento]) => [
        tipo,
        { titulo: reglamento.titulo, reglas: reglamento.reglas.map((texto) => ({ texto })), parrafos: reglamento.parrafos.map((texto) => ({ texto })) },
      ]),
    ) as Record<TipoDeReglamento, ReglamentoEditable>),
    horarioDelPredio: HORARIO_DEL_PREDIO,
    horarios: horarioDeActividades.map(({ actividad, horario, nota }) => ({ actividad, horario, nota: nota ?? "" })),
  },
  resenas: {
    puntaje: String(googleRating.score),
    cantidad: String(googleRating.count),
    resenas: googleReviews.map(({ name, rating, when, text }) => ({ name, rating: String(rating), when, text })),
  },
}

const foto: Campo = { tipo: "foto", clave: "foto", etiqueta: "Foto" }

const tarjeta = (nombres: string[]): Campo => ({
  tipo: "lista",
  clave: "",
  etiqueta: "",
  item: "Tarjeta",
  min: nombres.length,
  max: nombres.length,
  fija: true,
  nombres,
  campos: [{ tipo: "texto", clave: "titulo", etiqueta: "Título", max: 60 }, { tipo: "texto", clave: "detalle", etiqueta: "Texto", max: 220, multilinea: true }, foto],
})

const texto = (clave: string, etiqueta: string, max: number, extra: Partial<Extract<Campo, { tipo: "texto" }>> = {}): Campo => ({ tipo: "texto", clave, etiqueta, max, ...extra })
const encabezado = (clave: string, etiqueta: string): Campo => ({
  tipo: "grupo",
  clave,
  etiqueta,
  campos: [texto("kicker", "Antetítulo", 30), texto("titulo", "Título", 90), texto("texto", "Texto", 400, { multilinea: true })],
})
const reglamento = (clave: TipoDeReglamento): Campo => ({
  tipo: "grupo",
  clave,
  etiqueta: reglamentosDeFabrica[clave].titulo,
  campos: [
    texto("titulo", "Título", 80),
    { tipo: "lista", clave: "reglas", etiqueta: "Reglas", item: "Regla", min: 1, max: 30, campos: [texto("texto", "Texto", 400, { multilinea: true })] },
    { tipo: "lista", clave: "parrafos", etiqueta: "Párrafos del final", item: "Párrafo", min: 0, max: 8, campos: [texto("texto", "Texto", 600, { multilinea: true })] },
  ],
})

export const secciones: Record<ClaveFija, { nombre: string; descripcion: string; campos: Campo[] }> = {
  contacto: {
    nombre: "Contacto y redes",
    descripcion: "Los teléfonos, el correo y las redes que aparecen en «Más información», en el ticket de cada reserva y en los botones de WhatsApp.",
    campos: [
      { tipo: "texto", clave: "whatsapp", etiqueta: "WhatsApp", ayuda: "Con característica, como se muestra: 11 3009-1020.", max: 20, formato: "telefono" },
      { tipo: "texto", clave: "telefonoFijo", etiqueta: "Teléfono fijo", ayuda: "Si es de la zona (11) alcanza con los 8 números.", max: 20, formato: "telefono" },
      { tipo: "texto", clave: "email", etiqueta: "Correo", max: 80, formato: "email" },
      { tipo: "texto", clave: "facebook", etiqueta: "Facebook", ayuda: "Solo el usuario: lo que va después de facebook.com/.", max: 60, formato: "usuario" },
      { tipo: "texto", clave: "instagram", etiqueta: "Instagram", ayuda: "Solo el usuario, sin @.", max: 60, formato: "usuario" },
      { tipo: "texto", clave: "youtube", etiqueta: "YouTube", ayuda: "Solo el usuario del canal, sin @.", max: 60, formato: "usuario" },
      { tipo: "texto", clave: "tiktok", etiqueta: "TikTok", ayuda: "Solo el usuario, sin @.", max: 60, formato: "usuario" },
    ],
  },
  inicio: {
    nombre: "Inicio",
    descripcion: "Los textos y videos de la portada, la sección «Nosotros» con las fotos del equipo y el pie de todas las páginas.",
    campos: [
      { tipo: "texto", clave: "titulo", etiqueta: "Título de la portada", max: 80 },
      { tipo: "texto", clave: "subtitulo", etiqueta: "Bajada de la portada", max: 120 },
      { tipo: "video", clave: "videoPortada", etiqueta: "Video de la portada", ayuda: "Se ve detrás del título, sin sonido y en bucle." },
      { tipo: "texto", clave: "actividadesTitulo", etiqueta: "Título de las actividades", ayuda: "Encabeza las tarjetas de actividades; las tarjetas salen de cada ficha.", max: 80 },
      { tipo: "video", clave: "videoComoReservar", etiqueta: "Video de «Cómo reservar»" },
      { tipo: "video", clave: "videoUbicacion", etiqueta: "Video de «Ubicación»" },
      { tipo: "texto", clave: "comoReservarTitulo", etiqueta: "Título de «Cómo reservar»", max: 60 },
      { tipo: "texto", clave: "comoReservarTexto", etiqueta: "Texto de «Cómo reservar»", max: 220, multilinea: true },
      { tipo: "texto", clave: "nosotrosTitulo", etiqueta: "Título de «Nosotros»", max: 60 },
      { tipo: "texto", clave: "nosotrosTexto", etiqueta: "Texto de «Nosotros»", max: 320, multilinea: true },
      { tipo: "lista", clave: "fotosDelEquipo", etiqueta: "Fotos del equipo", ayuda: "Van pasando solas, en este orden.", item: "Foto", min: 1, max: 8, campos: [foto] },
      { tipo: "texto", clave: "frasePie", etiqueta: "Frase del pie de página", max: 120 },
      { tipo: "texto", clave: "cierrePie", etiqueta: "Cierre del pie de página", max: 80 },
    ],
  },
  propuestas: {
    nombre: "Propuestas",
    descripcion: "Las tarjetas del recuadro «¿Cómo reservar?», las de deportes en la naturaleza y los profes que coordinan las actividades.",
    campos: [
      { ...tarjeta(["Finde en familia", "Propuestas estudiantiles", "Deportes en la naturaleza", "Bungalows"]), clave: "caminos", etiqueta: "Tarjetas del recuadro" },
      { ...tarjeta(["Nado en aguas abiertas", "Resto de actividades"]), clave: "aventura", etiqueta: "Deportes en la naturaleza" },
      {
        tipo: "lista",
        clave: "profes",
        etiqueta: "Profes de las actividades",
        ayuda: "Se les escribe por WhatsApp para coordinar kayak, senderismo, trail y escalada.",
        item: "Profe",
        min: 1,
        max: 6,
        titulo: "nombre",
        campos: [
          { tipo: "texto", clave: "nombre", etiqueta: "Nombre", max: 40 },
          { tipo: "texto", clave: "telefono", etiqueta: "WhatsApp", max: 20, formato: "telefono" },
        ],
      },
    ],
  },
  paginas: {
    nombre: "Encabezados de páginas",
    descripcion: "El título grande y el texto de entrada de Actividades, Estadía y Restaurante.",
    campos: [encabezado("actividades", "Actividades"), encabezado("estadia", "Estadía"), encabezado("restaurante", "Restaurante")],
  },
  reglamentos: {
    nombre: "Reglamentos y horarios",
    descripcion: "Lo que se ve en cada ticket y en /reglamento, y lo que quien reserva le reenvía al grupo por WhatsApp.",
    campos: [
      reglamento("finde"),
      reglamento("bungalow"),
      reglamento("nado"),
      texto("horarioDelPredio", "Horario del predio", 40, { ayuda: "Como se lee: «De 10 a 19 hs». También va en el mensaje para el grupo." }),
      {
        tipo: "lista",
        clave: "horarios",
        etiqueta: "Horario de actividades",
        ayuda: "Se manda a quienes reservan finde en familia o bungalow.",
        item: "Actividad",
        min: 1,
        max: 20,
        titulo: "actividad",
        campos: [texto("actividad", "Actividad", 60), texto("horario", "Horario", 60), texto("nota", "Nota", 160, { opcional: true })],
      },
    ],
  },
  resenas: {
    nombre: "Reseñas",
    descripcion: "El puntaje de Google y las opiniones que se muestran en «Puntuación».",
    campos: [
      texto("puntaje", "Puntaje en Google", 4, { formato: "numero", ayuda: "Por ejemplo 4,7." }),
      texto("cantidad", "Cantidad de opiniones", 7, { formato: "numero" }),
      {
        tipo: "lista",
        clave: "resenas",
        etiqueta: "Opiniones",
        item: "Opinión",
        min: 1,
        max: 12,
        titulo: "name",
        campos: [texto("name", "Nombre", 60), texto("rating", "Estrellas", 1, { formato: "estrellas" }), texto("when", "Cuándo", 40), texto("text", "Texto", 900, { multilinea: true })],
      },
    ],
  },
}
