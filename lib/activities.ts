/**
 * Catálogo público del predio.
 * Para sumar o sacar una actividad, editá este archivo.
 * Los textos siguen lo publicado en lagolacandelaria.com.ar:
 * no hay precios ni horarios fijos, porque el predio los confirma al reservar.
 */

export const realmOrder = ["agua", "altura", "tierra", "grupos"] as const

export type Realm = (typeof realmOrder)[number]

export const realms: Record<
  Realm,
  { label: string; numeral: string; title: string; lede: string }
> = {
  agua: {
    label: "Agua",
    numeral: "01",
    title: "El lago primero.",
    lede: "Remo con el equipo y, en verano, agua quieta.",
  },
  altura: {
    label: "Altura",
    numeral: "02",
    title: "Arnés, cable, lago abajo.",
    lede: "Todo lo de altura lo coordina el staff. No se sube por libre.",
  },
  tierra: {
    label: "Tierra",
    numeral: "03",
    title: "El predio, cuando bajás el ritmo.",
    lede: "Caminata guiada, y canchas y plaza para el rato que no tiene turno.",
  },
  grupos: {
    label: "Grupos",
    numeral: "04",
    title: "Cuando vienen muchos.",
    lede: "La jornada y el fogón se arman con el curso, no como una actividad suelta.",
  },
}

export type Activity = {
  slug: string
  name: string
  realm: Realm
  signature?: boolean
  summary: string
  lead: string
  body: string[]
  forWhom: string
  how: string
  note?: string
}

export const activities: Activity[] = [
  {
    slug: "canotaje",
    name: "Canotaje",
    realm: "agua",
    signature: true,
    summary: "Kayaks triplos y canoas, con el staff en el agua.",
    lead: "El lago no se mira de la orilla. Se entra.",
    body: [
      "Hay remo en kayaks triplos y en canoas. No es un alquiler que queda tirado en el muelle: el turno lo abre el equipo, con chaleco y con el rato que corresponde a ese día.",
      "En un finde en familia el turno suele ser breve y guiado. En un campamento o una salida, el tiempo en el agua se conversa con el grupo antes de llegar.",
    ],
    forWhom:
      "Familias, cursos y cualquiera que quiera el lago de cerca. Si hay chicos, el staff ordena quién entra y cuándo.",
    how: "Se pide al reservar. El día de la visita te dicen embarcación, chaleco y el momento del turno.",
    note: "El horario cambia con la fecha. No lo publicamos como si fuera fijo.",
  },
  {
    slug: "pileta-natural",
    name: "Pileta natural",
    realm: "agua",
    summary: "Agua quieta y juegos, cuando es verano.",
    lead: "En temporada, el predio suma una pileta natural y juegos acuáticos.",
    body: [
      "La pileta natural y los juegos acuáticos están en el programa de verano, coordinados por el personal, igual que el resto de las actividades guiadas.",
      "Fuera de esa temporada el plan vuelve al lago, a la altura y al predio. Si tu fecha cae en verano, preguntalo al reservar.",
    ],
    forWhom: "Quien visita en temporada de verano y quiere agua sin el remo.",
    how: "Se confirma con la reserva, porque depende de la temporada.",
    note: "Solo en temporada de verano.",
  },
  {
    slug: "tirolesa",
    name: "Tirolesa",
    realm: "altura",
    signature: true,
    summary: "Distintas alturas: una baja y una alta, siempre con staff.",
    lead: "Primero el arnés. Después, el lago.",
    body: [
      "Hay tirolesas de distintas alturas. En el programa de familia aparecen una baja y una alta, en turnos separados, con el equipo encima todo el tiempo.",
      "No hace falta haberlo hecho antes. Hace falta reserva, y que el staff te diga cuál te toca según la edad y el día.",
    ],
    forWhom:
      "Quien quiera la altura, de la primera vez a la que ya pide la más alta. El equipo acomoda el turno.",
    how: "La pedís al reservar. El día de la visita, el staff indica arnés, altura y horario del turno.",
    note: "Los turnos de la baja y de la alta no son el mismo. Se confirman con la fecha.",
  },
  {
    slug: "parque-aereo",
    name: "Parque aéreo",
    realm: "altura",
    summary: "Puentes de distintos niveles, del infantil al que pide más pulso.",
    lead: "Un circuito colgado, con niveles de verdad.",
    body: [
      "El parque aéreo tiene distintos niveles y dificultades. En el programa de familia entran el puente aéreo para niños, los niveles 1 y 2 desde los 12 años, y el puente tibetano.",
      "Nada de esto se recorre solo. Lo guía y lo coordina el personal del predio, en el horario de ese día.",
    ],
    forWhom:
      "Chicos, adolescentes y adultos. El nivel lo define la edad y lo que el equipo considere para ese grupo.",
    how: "Se pide al reservar. El día, el staff arma el turno y el nivel.",
    note: "El puente de niños y los niveles desde los 12 no comparten el mismo turno.",
  },
  {
    slug: "palestra",
    name: "Palestra",
    realm: "altura",
    summary: "Escalada deportiva, con quien te asegura desde abajo.",
    lead: "Una pared, un arnés y alguien del predio que no te suelta.",
    body: [
      "La palestra es escalada deportiva dentro de las actividades guiadas. No es un muro libre: el personal coordina el turno.",
      "Entra en el mismo espíritu que la tirolesa y el parque aéreo. Si el grupo es un curso, se arma junto con el resto de la jornada.",
    ],
    forWhom: "Quien quiera probar la pared, con o sin experiencia, siempre con el equipo.",
    how: "Se incluye en la reserva. El horario del turno se confirma con la fecha.",
  },
  {
    slug: "pendulo",
    name: "Péndulo",
    realm: "altura",
    summary: "Un vuelo corto, coordinado, para cuando el grupo ya entró en calor.",
    lead: "Un salto contenido. El staff lleva el tiempo.",
    body: [
      "El péndulo forma parte de las actividades de aventura guiadas. Es un momento breve, no una estación en la que te quedás solo.",
      "Suele entrar en el medio del día, entre la altura y el agua, según cómo esté armado ese programa.",
    ],
    forWhom: "Grupos y familias que ya están en la jornada y quieren un golpe de altura más.",
    how: "Se pide con el resto de las actividades. El turno lo marca el equipo ese día.",
  },
  {
    slug: "caminata",
    name: "Circuito de caminata",
    realm: "tierra",
    summary: "El predio se recorre. Veintisiete hectáreas dan para eso.",
    lead: "Una vuelta por el terreno, con alguien del equipo adelante.",
    body: [
      "El circuito de caminata está entre las actividades que guía el personal. No es un sendero que se inventa sobre la marcha: tiene recorrido y tiene quien lo coordina.",
      "Sirve para bajar la adrenalina de la altura o para empezar el día mirando dónde están el lago, las canchas y la mesa.",
    ],
    forWhom: "Cualquier grupo que quiera el predio a pie, sin que sea una prueba.",
    how: "Se coordina al reservar, junto con el resto del día.",
  },
  {
    slug: "canchas",
    name: "Canchas",
    realm: "tierra",
    summary: "Vóley, fútbol, fútbol tenis y tejo, para el rato que no tiene turno.",
    lead: "Cuando el staff no los está llamando, el predio sigue abierto.",
    body: [
      "Hay canchas de vóley, fútbol, fútbol tenis y tejo. En el programa de familia quedan como actividades libres: no dependen de un turno con el equipo.",
      "Alcanza con que la visita esté reservada. El rato libre se usa mientras el resto del día sigue su curso.",
    ],
    forWhom: "Familias y grupos que quieren pelota entre una actividad y la otra.",
    how: "No se reserva un turno aparte. Forman parte del predio el día de la visita.",
  },
  {
    slug: "plaza-infantil",
    name: "Plaza infantil",
    realm: "tierra",
    summary: "Un rato de madera y sombra para los más chicos.",
    lead: "Para cuando el grupo es chico y el día es largo.",
    body: [
      "La plaza infantil está en el predio como actividad libre, en el mismo sentido que las canchas: no hace falta un turno con el staff.",
      "Los más chicos pueden bajar el ritmo ahí mientras el resto sigue en el agua o en la altura.",
    ],
    forWhom: "Familias con chicos chicos, en el medio de un día que tiene de todo.",
    how: "Está disponible durante la visita. No se pide como una actividad guiada.",
  },
  {
    slug: "fogon",
    name: "Fogón",
    realm: "grupos",
    summary: "El cierre del campamento, cuando el día ya dio todo.",
    lead: "El fogón pertenece al campamento, no a una visita de paso.",
    body: [
      "En la propuesta de campamentos el fogón tiene su lugar. No es una fogata libre en cualquier rincón del predio: se coordina con el equipo.",
      "Si el grupo viene por una jornada o se queda a dormir, el fogón se conversa junto con el formato —carpa, dormis o día entero—.",
    ],
    forWhom: "Cursos y grupos que arman campamento, no una visita suelta de unas horas.",
    how: "Se pide con la reserva del campamento. El equipo dice cómo se hace y en qué momento del día.",
  },
  {
    slug: "jornada-de-aventura",
    name: "Jornada de aventura",
    realm: "grupos",
    summary: "Un día entero de actividades para el curso, sin pernocte.",
    lead: "Llegan de mañana. Se van con el día cumplido.",
    body: [
      "La jornada de aventura es una de las tres formas de campamento del predio, junto con la carpa y los dormis. Es el formato para el curso que quiere todo el día y vuelve a dormir a otro lado.",
      "Adentro entran las actividades guiadas: tirolesa, parque aéreo, palestra, péndulo, remo y caminata. El menú exacto de esa fecha se cierra con el equipo.",
    ],
    forWhom: "Escuelas, profesorados y grupos que necesitan una salida de un día, con alguien a cargo.",
    how: "Se reserva como campamento. En la consulta van cantidad, edades y qué actividades no pueden faltar.",
  },
]

const bySlug = new Map(activities.map((activity) => [activity.slug, activity]))

export function getActivity(slug: string) {
  return bySlug.get(slug)
}

export function activitiesIn(realm: Realm) {
  return activities.filter((activity) => activity.realm === realm)
}

export function relatedActivities(activity: Activity) {
  return activitiesIn(activity.realm).filter((item) => item.slug !== activity.slug)
}

export const interestChoices = [
  ...activities.map((activity) => ({
    id: activity.slug,
    label: activity.name,
    group: realms[activity.realm].label,
  })),
  { id: "bungalows", label: "Bungalows", group: "Estadía y mesa" },
  { id: "campamentos", label: "Campamentos", group: "Estadía y mesa" },
  { id: "restaurante", label: "Restaurante", group: "Estadía y mesa" },
]

const interestIds = new Set(interestChoices.map((choice) => choice.id))

export function isInterest(value: string | undefined): value is string {
  return !!value && interestIds.has(value)
}

export const moreLinks = [
  { href: "/categorias/parque-aereo", label: "el parque aéreo" },
  { href: "/categorias/canchas", label: "las canchas" },
  { href: "/categorias/playa", label: "la pileta de verano" },
  { href: "/categorias/lago", label: "el lago" },
  { href: "/categorias/parrillas", label: "las parrillas" },
  { href: "/estadia/campamento", label: "el fogón" },
] as const
