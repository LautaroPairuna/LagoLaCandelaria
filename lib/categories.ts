import type { ZoneId } from "@/lib/offers"
import type { VisitType } from "@/lib/site"

/**
 * Fichas públicas de actividades.
 * La entrada es al predio: estas páginas explican cómo se hace cada cosa,
 * con qué infraestructura y qué cuida el personal. No venden un turno suelto.
 *
 * Horarios del finde: programa publicado para sábados, domingos y feriados.
 * Cantidades: solo las que el predio publica (4 bungalows, cada uno con parrilla).
 */

export type Photo = {
  src: string
  alt: string
  position?: string
}

export type FactId = "seguridad" | "edades" | "instructor" | "horario" | "variantes"

export type Fact = {
  id: FactId
  label: string
  value: string
}

export type Subactivity = {
  slug: string
  name: string
  chip: string
  how: string
  photos: Photo[]
}

export type InfraItem = {
  name: string
  text: string
}

export type Grounds = {
  title: string
  lede: string
  total: string
  highlights: { count: string; label: string }[]
  primary: Array<ZoneId | "predio">
  context?: ZoneId[]
  photo: Photo
  spots: { id: string; name: string; count: string; detail: string; href: string }[]
}

export type Category = {
  slug: string
  title: string
  kicker: string
  summary: string
  banner: Photo
  intro: string
  facts: Fact[]
  subactivities: Subactivity[]
  infrastructure: InfraItem[]
  safetyTitle: string
  safety: string[]
  grounds?: Grounds
  reserve?: {
    visita?: VisitType
    intereses: string[]
  }
}

const grounds: Grounds = {
  title: "Dónde están",
  lede: "Plano de orientación del predio. Marca el sector y la cantidad publicada: cuatro bungalows, cada uno con parrilla. Las parrillas del día y las palapas son zonas, con puestos y sombra en el mismo campo.",
  total: "4 parrillas en los bungalows, más el sector de parrillas del día y el sector de palapas.",
  highlights: [
    { count: "4", label: "Parrillas de bungalow" },
    { count: "Sector", label: "Parrillas del día" },
    { count: "Sector", label: "Palapas" },
  ],
  primary: ["parrillas", "palapas", "bungalows"],
  context: ["mesa", "lago"],
  photo: {
    src: "/activities/campamentos.jpg",
    alt: "Vista aérea del predio: el agua en primer plano, carpas en el centro y un gazebo de techo anaranjado en el campo.",
    position: "center",
  },
  spots: [
    {
      id: "bungalows",
      name: "Bungalows",
      count: "4",
      detail: "Cuatro casas. Cada una tiene parrilla propia, aparte del sector del día.",
      href: "/estadia/bungalows",
    },
    {
      id: "parque",
      name: "Parque aéreo",
      count: "Altura",
      detail: "Tirolesas, palestra, péndulo y puentes, siempre con el personal.",
      href: "/categorias/parque-aereo",
    },
    {
      id: "palapas",
      name: "Palapas",
      count: "Sector",
      detail: "Gazebos de sombra y mesa. En el predio este sector se llama gazebo.",
      href: "/categorias/parrillas#palapas",
    },
    {
      id: "parrillas",
      name: "Parrillas del día",
      count: "Sector",
      detail: "Puestos numerados para el fuego del grupo que pasa el día.",
      href: "/categorias/parrillas#parrillas",
    },
    {
      id: "canchas",
      name: "Canchas",
      count: "Libres",
      detail: "Fútbol, vóley, fútbol tenis y tejo, de 11:00 a 17:00.",
      href: "/categorias/canchas",
    },
    {
      id: "restaurante",
      name: "Restaurante",
      count: "Mesa",
      detail: "La mesa del predio, junto al sector de fuego y sombra.",
      href: "/categorias/bar#restaurante",
    },
    {
      id: "bar",
      name: "Bar de playa",
      count: "Barra",
      detail: "Barra cerca del agua, para el rato entre actividades.",
      href: "/categorias/bar#bar-de-playa",
    },
    {
      id: "playa",
      name: "Playa, palapas y pileta",
      count: "Verano",
      detail: "Orilla artificial, pileta y juegos acuáticos en temporada.",
      href: "/categorias/playa",
    },
    {
      id: "lago",
      name: "Lago",
      count: "Agua",
      detail: "Remo y nado en aguas abiertas, con el personal en el agua.",
      href: "/categorias/lago",
    },
    {
      id: "carpas",
      name: "Carpas",
      count: "Sector",
      detail: "Sector de campamento. El fogón de esa jornada lo coordina el personal.",
      href: "/estadia/campamento#campamento-en-carpa",
    },
    {
      id: "dormis",
      name: "Dormis",
      count: "Cama",
      detail: "Noche con cama, no en carpa. El sector de dormis está en el mismo campamento.",
      href: "/estadia/campamento#campamento-en-dormis",
    },
  ],
}

export const categories: Category[] = [
  {
    slug: "lago",
    title: "Actividades en el lago",
    kicker: "Agua",
    summary: "Kayak triplo, canoa y nado en aguas abiertas, con el personal en el agua.",
    reserve: { intereses: ["canotaje"] },
    banner: {
      src: "/covers/lago.jpg",
      alt: "Tres personas en un kayak verde en el lago, con chalecos y remos.",
      position: "center 42%",
    },
    intro:
      "El lago se entra con el personal del predio. Hay tres variantes: remo en kayak triplo, remo en canoa y nado en aguas abiertas. El staff abre el turno, entrega el chaleco y se queda en el agua. En el programa de finde, el remo va de 12:00 a 15:00 y cada salida dura unos 20 minutos. En un curso, el personal ordena las tandas sobre estas mismas embarcaciones.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "Chaleco puesto y personal en el agua durante el turno.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Familias y cursos. El equipo indica quién sube y en qué tanda.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Personal del predio en el agua, de punta a punta del turno.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Remo de 12:00 a 15:00. Cada salida, unos 20 minutos.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Kayak triplo, canoa y nado en aguas abiertas.",
      },
    ],
    subactivities: [
      {
        slug: "remo-en-kayak",
        name: "Remo en kayak",
        chip: "Kayak",
        how: "Se rema en kayaks triplos. El personal entrega el chaleco, acomoda a quienes suben y acompaña la salida dentro de la franja de 12:00 a 15:00. La embarcación sale cuando el staff abre el turno, y la vuelta cierra a los 20 minutos. En familia el grupo rota. En un curso, las tandas se arman con la cantidad de chicos que hay ese día.",
        photos: [
          {
            src: "/lago.jpg",
            alt: "Persona con chaleco salvavidas remando en un lago.",
            position: "center 35%",
          },
          {
            src: "/activities/canotaje.jpg",
            alt: "Orilla del agua del predio, con piedras, árboles y el sector de carpas arriba.",
            position: "center",
          },
        ],
      },
      {
        slug: "remo-en-canoa",
        name: "Remo en canoa",
        chip: "Canotaje",
        how: "La canoa comparte el turno de remo con el kayak: mismo horario, mismo chaleco y el personal en el agua. Cambia la embarcación. La salida también dura unos 20 minutos, entre las 12:00 y las 15:00. Sirve para ir de a varios en la misma barca y recorrer el espejo de cerca, con islas y orilla a la vista.",
        photos: [
          {
            src: "/activities/canotaje.jpg",
            alt: "El agua del predio vista desde arriba, con la orilla de piedras y las carpas.",
            position: "center 60%",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "Vista aérea del lago junto al sector de carpas y el campo del predio.",
            position: "center 70%",
          },
        ],
      },
      {
        slug: "nado-en-aguas-abiertas",
        name: "Nado en aguas abiertas",
        chip: "Nado en aguas abiertas",
        how: "El lago también se nada. Es aguas abiertas: el espejo del predio, con orilla e islas, y el personal presente en el agua. Queda aparte de la playa artificial y de la pileta, que son de temporada y tienen su propia ficha. El nado se hace con el staff en el agua, en el rato en que el lago está habilitado ese día.",
        photos: [
          {
            src: "/lago.jpg",
            alt: "Persona en el agua de un lago, con chaleco, en una mañana de sol.",
            position: "center 55%",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "El espejo de agua del predio, oscuro, contra la orilla de piedras.",
            position: "center bottom",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Kayaks triplos",
        text: "Embarcaciones para entrar al lago de a varios, en el turno de remo.",
      },
      {
        name: "Canoas",
        text: "La otra barca del mismo turno, con el mismo personal y el mismo chaleco.",
      },
      {
        name: "Chalecos",
        text: "Se colocan antes de subir. El staff los entrega al abrir la salida.",
      },
      {
        name: "Personal en el agua",
        text: "Abre el turno, ordena las tandas y permanece en el lago mientras dura.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "El chaleco va puesto antes de subir a la embarcación.",
      "El turno lo abre el personal. El remo corre de 12:00 a 15:00 y cada salida dura unos 20 minutos.",
      "Kayak y canoa comparten esa franja. El nado en aguas abiertas se hace con el personal en el agua.",
      "Si hay chicos, el equipo dice quién entra y en qué tanda.",
      "La playa artificial y la pileta son otra agua, de temporada, y están en su ficha.",
    ],
    grounds: focusGrounds(["lago"], {
      title: "Un lago para el remo y el nado",
      lede: "Kayak, canoa y nado abierto salen de este espejo de agua. La playa y la pileta están al lado, y son otra ficha.",
      total: "1 lago. Tres formas de entrar: kayak triplo, canoa y nado.",
      highlights: [
        { count: "1", label: "Lago" },
        { count: "20 min", label: "Cada salida de remo" },
        { count: "12–15", label: "Franja de remo en finde" },
      ],
    }),
  },
  {
    slug: "parque-aereo",
    title: "Parque aéreo",
    kicker: "Altura",
    summary: "Tirolesas, palestra, péndulo y puentes. El personal coloca el arnés y marca cada turno.",
    reserve: { intereses: ["tirolesa", "parque-aereo", "palestra", "pendulo"] },
    banner: {
      src: "/covers/parque-aereo.jpg",
      alt: "Personas con casco y arnés en el parque aéreo, entre pinos.",
      position: "center 30%",
    },
    intro:
      "Toda la altura la coordina el personal. Las variantes son tirolesa baja, tirolesa alta, palestra, péndulo, puente aéreo para niños, niveles 1 y 2, y puente tibetano. El staff coloca el arnés y abre el turno de cada una. El puente de niños es de 5 a 12 años. Los niveles 1 y 2 empiezan a los 12. Cada variante tiene su horario entre las 11:00 y las 17:00, y se recorre con el equipo encima.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "Arnés colocado por el personal. Cada recorrido va con el staff.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Puente de niños de 5 a 12 años. Niveles 1 y 2 desde los 12.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Personal del predio en cada turno de altura.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Turnos separados entre las 11:00 y las 17:00.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Dos tirolesas, palestra, péndulo y tres tramos de puente.",
      },
    ],
    subactivities: [
      {
        slug: "tirolesa",
        name: "Tirolesa",
        chip: "Tirolesa",
        how: "Hay dos alturas, en turnos distintos. La baja va de 11:00 a 12:00. La alta va de 14:30 a 15:30 y es el vuelo más largo, sobre el lago. El personal indica el arnés y cuál corresponde según la edad y el día. Sirve tanto para la primera vez como para quien ya pide la más alta.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Pradera del predio con dos techos anaranjados y el monte cerrado al fondo.",
            position: "center",
          },
          {
            src: "/parque.jpg",
            alt: "Persona con arnés suspendida de una pared de roca.",
            position: "left center",
          },
        ],
      },
      {
        slug: "palestra",
        name: "Palestra",
        chip: "Palestra",
        how: "Escalada deportiva en la pared del predio. Alguien del personal asegura desde abajo y coordina el turno, de 14:00 a 15:30. Se sube con arnés, en la tanda que abre el staff. En un curso entra en la misma jornada que el resto de la altura.",
        photos: [
          {
            src: "/parque.jpg",
            alt: "Escalador con arnés y cuerda en una pared de roca.",
            position: "center 30%",
          },
        ],
      },
      {
        slug: "pendulo",
        name: "Péndulo",
        chip: "Péndulo",
        how: "Un vuelo corto y contenido, de 13:30 a 14:30. Entra en el medio del día, cuando el grupo ya pasó por otra altura. El personal lleva el tiempo del salto y el arnés. Es un momento breve dentro de la jornada, con el staff al lado.",
        photos: [
          {
            src: "/parque.jpg",
            alt: "Persona con arnés en un recorrido de altura.",
            position: "center 20%",
          },
        ],
      },
      {
        slug: "puente-ninos",
        name: "Puente aéreo para niños",
        chip: "Puente niños",
        how: "Circuito colgado para chicos de 5 a 12 años. Tiene dos franjas: de 11:00 a 13:00 y de 15:00 a 17:00. El personal guía el recorrido y coloca el arnés. Es el tramo de altura pensado para esa edad, separado de los niveles que empiezan a los 12.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Campo abierto del predio, donde está la zona de altura.",
            position: "center 40%",
          },
          {
            src: "/parque.jpg",
            alt: "Recorrido de altura con arnés y cuerda.",
            position: "left 40%",
          },
        ],
      },
      {
        slug: "puente-niveles",
        name: "Puente aéreo, niveles 1 y 2",
        chip: "Niveles 1 y 2",
        how: "Desde los 12 años, de 15:30 a 17:00. Pide más pulso que el circuito de niños. El personal confirma el nivel en el momento del turno y acompaña el cruce. Los dos niveles comparten esa franja de la tarde.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Vista amplia del predio: pasto, dos construcciones con techo rojo y bosque.",
            position: "center",
          },
        ],
      },
      {
        slug: "puente-tibetano",
        name: "Puente tibetano",
        chip: "Tibetano",
        how: "Tramo del circuito colgado, de 16:00 a 17:00. Se cruza con el personal, en esa ventana de la tarde. El arnés lo coloca el staff, igual que en el resto de los puentes. Entra al final de los turnos de altura del día.",
        photos: [
          {
            src: "/parque.jpg",
            alt: "Cuerdas y arnés en una travesía de altura.",
            position: "left 20%",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Tirolesa baja y tirolesa alta",
        text: "Dos cables, dos turnos. La alta es el vuelo largo, de 14:30 a 15:30.",
      },
      {
        name: "Palestra",
        text: "Pared de escalada deportiva, con quien asegura desde abajo.",
      },
      {
        name: "Péndulo",
        text: "Un vuelo corto en el medio del día, de 13:30 a 14:30.",
      },
      {
        name: "Puentes",
        text: "Circuito de niños, niveles 1 y 2 desde los 12, y puente tibetano.",
      },
      {
        name: "Arnés y personal",
        text: "El equipo de altura coloca el arnés y permanece en cada turno.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "El arnés lo coloca el personal del predio.",
      "Cada variante tiene su turno. La tirolesa baja va de 11:00 a 12:00 y la alta de 14:30 a 15:30.",
      "El puente de niños es para 5 a 12 años, en dos franjas: 11:00 a 13:00 y 15:00 a 17:00.",
      "Los niveles 1 y 2 son desde los 12 años, de 15:30 a 17:00. El puente tibetano, de 16:00 a 17:00.",
      "La palestra va de 14:00 a 15:30 y el péndulo de 13:30 a 14:30, siempre con el staff.",
    ],
    grounds: focusGrounds(["parque"], {
      title: "La altura, en un solo sector",
      lede: "Tirolesas, palestra, péndulo y puentes están juntos. El plano marca ese sector, no un cable suelto en cada rincón del predio.",
      total: "1 sector de altura. Cada variante tiene su turno.",
      highlights: [
        { count: "1", label: "Sector de altura" },
        { count: "2", label: "Tirolesas, baja y alta" },
        { count: "Staff", label: "Arnés y turno" },
      ],
    }),
  },
  {
    slug: "canchas",
    title: "Canchas y deportes",
    kicker: "Predio",
    summary: "Fútbol, vóley, fútbol tenis, tejo y plaza, libres. La caminata la guía el personal.",
    reserve: { intereses: ["canchas", "caminata"] },
    banner: {
      src: "/covers/canchas.jpg",
      alt: "Grupo jugando vóley en la cancha de arena, con el lago y un arcoíris de fondo.",
      position: "center 55%",
    },
    intro:
      "Cuando el personal está en la altura o en el lago, el predio sigue abierto para pelota y para los más chicos. Fútbol, vóley, fútbol tenis, tejo y la plaza infantil son actividades libres, de 11:00 a 17:00. La caminata es distinta: un circuito de 2,5 km con vista a una cascada, y alguien del equipo adelante. Esas son las variantes de este lado del día.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "Canchas y plaza dentro del predio. La caminata, con el personal adelante.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Para quien ya está en el día. La plaza es el rato de los más chicos.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Canchas y plaza, libres. La caminata la guía el personal.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Libres de 11:00 a 17:00. La caminata, en el recorrido del día.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Fútbol, vóley, fútbol tenis, tejo, plaza y caminata.",
      },
    ],
    subactivities: [
      {
        slug: "futbol",
        name: "Fútbol",
        chip: "Fútbol",
        how: "Cancha libre dentro del predio. Entra en la franja de 11:00 a 17:00, en el rato que el grupo tiene entre un turno guiado y el otro. Se usa con la visita al predio: la pelota está ahí, en el campo.",
        photos: [
          {
            src: "/canchas.jpg",
            alt: "Jugadores en una cancha de fútbol bajo la luz de los reflectores.",
            position: "center",
          },
        ],
      },
      {
        slug: "voley",
        name: "Vóley",
        chip: "Vóley",
        how: "Cancha de vóley para el mismo rato libre, de 11:00 a 17:00. Comparte la lógica del fútbol: se juega en el predio, entre las actividades que coordina el personal, y alcanza con estar en el día.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Campo abierto del predio, con pasto y construcciones bajas.",
            position: "center 55%",
          },
        ],
      },
      {
        slug: "futbol-tenis",
        name: "Fútbol tenis",
        chip: "Fútbol tenis",
        how: "Actividad libre, en la misma franja que el fútbol y el vóley: de 11:00 a 17:00. Es para el grupo que quiere pelota en un espacio más chico, sin un turno con el staff.",
        photos: [
          {
            src: "/activities/bungalows.jpg",
            alt: "Pradera del predio vista desde arriba, con claro de pasto y árboles.",
            position: "center",
          },
        ],
      },
      {
        slug: "tejo",
        name: "Tejo",
        chip: "Tejo",
        how: "El tejo está entre las actividades libres del predio, de 11:00 a 17:00. Se juega en su lugar, en el rato de campo, con la misma disponibilidad que las canchas.",
        photos: [
          {
            src: "/activities/bungalows.jpg",
            alt: "Sector de campo del predio, con árboles y una construcción de techo claro.",
            position: "left center",
          },
        ],
      },
      {
        slug: "plaza-infantil",
        name: "Plaza infantil",
        chip: "Plaza",
        how: "Un rato de madera y sombra para los más chicos, de 11:00 a 17:00, sin turno de staff. Sirve para bajar el ritmo mientras el resto sigue en el agua o en la altura. Está en el predio como parte del día libre.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Arboleda y claro del predio, con sombra y campo alrededor.",
            position: "left center",
          },
        ],
      },
      {
        slug: "caminata",
        name: "Circuito de caminata",
        chip: "Caminata",
        how: "Circuito interpretativo de 2,5 km, con una vista a una cascada. Tiene recorrido fijo y alguien del personal adelante. Sirve para ver dónde quedan el lago, las canchas y la mesa, o para bajar de la altura y seguir el día a pie. El personal coordina la salida.",
        photos: [
          {
            src: "/activities/tirolesa.jpg",
            alt: "Monte y pradera del predio, el paisaje que recorre la caminata.",
            position: "center 30%",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "Camino, agua y campo vistos desde arriba en el predio.",
            position: "center",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Cancha de fútbol",
        text: "Libre de 11:00 a 17:00, entre los turnos guiados.",
      },
      {
        name: "Cancha de vóley",
        text: "En la misma franja libre que el fútbol.",
      },
      {
        name: "Fútbol tenis y tejo",
        text: "Dos juegos más del rato de campo, sin turno de staff.",
      },
      {
        name: "Plaza infantil",
        text: "Juegos para los más chicos, de 11:00 a 17:00.",
      },
      {
        name: "Circuito de 2,5 km",
        text: "Caminata con vista a una cascada y el personal adelante.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "Fútbol, vóley, fútbol tenis, tejo y la plaza se usan de 11:00 a 17:00.",
      "Esas cinco son libres: el personal está en la altura y en el agua, y el campo queda para el grupo.",
      "La caminata mide 2,5 km e incluye la vista a la cascada.",
      "En la caminata el personal va adelante. El circuito tiene recorrido, y la salida la coordina el equipo.",
    ],
    grounds: focusGrounds(["canchas"], {
      title: "El campo, cuando no hay turno",
      lede: "Las canchas son un sector libre del predio. La caminata sale de ahí y recorre más terreno: 2,5 km, con el personal adelante.",
      total: "Canchas libres de 11:00 a 17:00. La caminata, guiada.",
      highlights: [
        { count: "Libre", label: "Fútbol, vóley, fútbol tenis y tejo" },
        { count: "2,5 km", label: "Circuito de caminata" },
        { count: "11–17", label: "Rato de canchas y plaza" },
      ],
    }),
  },
  {
    slug: "playa",
    title: "Playa, palapas y pileta",
    kicker: "Verano",
    summary: "Playa artificial, pileta y juegos acuáticos en temporada, con el personal.",
    reserve: { intereses: ["pileta-natural"] },
    banner: {
      src: "/covers/playa.jpg",
      alt: "Pileta con sombrillas, palapas y juegos inflables junto a la orilla.",
      position: "center",
    },
    intro:
      "La orilla artificial y el agua quieta son para quedarse a jugar, aparte del lago abierto. Hay tres variantes, todas de temporada de verano: playa artificial, pileta y juegos acuáticos. Las coordina el personal del predio. El día de finde abre de 10:00 a 19:00. Fuera del verano, el agua del programa vuelve al lago, al remo y al nado.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "Agua de temporada coordinada por el personal del predio.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Para quien quiere agua sin remo. Los juegos son el rato de pileta.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Personal del predio en la playa y la pileta, en verano.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Temporada de verano, dentro del día de 10:00 a 19:00.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Playa artificial, pileta y juegos acuáticos.",
      },
    ],
    subactivities: [
      {
        slug: "playa-artificial",
        name: "Playa artificial",
        chip: "Playa artificial",
        how: "Una orilla armada en el predio para quedarse en el agua sin salir al lago abierto. Entra en el programa de verano, con el personal, junto con la pileta y los juegos. Tiene arena y sombra cerca, para el grupo que quiere la orilla y no el remo.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Deck, agua turquesa y sombra junto a una pileta.",
            position: "center",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "Orilla del agua del predio contra el campo y las carpas.",
            position: "center bottom",
          },
        ],
      },
      {
        slug: "pileta",
        name: "Pileta",
        chip: "Pileta",
        how: "Agua quieta, coordinada por el personal, en el programa de verano. Es más contenida que el lago: sirve para jugar y para quedarse, con el staff en ese sector. En los bungalows hay además una pileta compartida de las casas, distinta de esta pileta del día.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Pileta rodeada de deck de madera, plantas y un aro salvavidas.",
            position: "center 60%",
          },
        ],
      },
      {
        slug: "juegos-acuaticos",
        name: "Juegos acuáticos",
        chip: "Juegos acuáticos",
        how: "Inflables y juegos en el agua del rato de pileta y de playa. Van en la misma temporada y con el mismo personal. En verano arman ese sector para el juego. En invierno el programa de agua queda en el lago.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Agua quieta y sector de descanso junto a la pileta.",
            position: "center 30%",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Playa artificial",
        text: "Orilla armada, de temporada, para estar en el agua sin el lago abierto.",
      },
      {
        name: "Pileta",
        text: "Agua quieta del día, coordinada por el personal en verano.",
      },
      {
        name: "Juegos acuáticos",
        text: "Inflables y juegos del mismo sector, solo en temporada.",
      },
      {
        name: "Personal de verano",
        text: "Coordina playa, pileta y juegos mientras el sector está abierto.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "Playa, pileta y juegos acuáticos son de temporada de verano.",
      "El personal coordina ese agua, igual que en el resto de las actividades guiadas.",
      "El nado del lago abierto y el remo están en la ficha del lago, con chaleco y turno.",
      "Los findes y feriados el predio abre de 10:00 a 19:00. El sector de verano vive dentro de ese día.",
    ],
    grounds: focusGrounds(["playa"], {
      title: "Orilla y pileta, al lado del lago",
      lede: "La playa artificial y la pileta están del lado del agua, aparte del lago abierto. Entran en temporada de verano.",
      total: "1 sector de verano: playa, pileta y juegos.",
      highlights: [
        { count: "Verano", label: "Playa, pileta y juegos" },
        { count: "Aparte", label: "Del lago abierto" },
        { count: "10–19", label: "El día de finde" },
      ],
    }),
  },
  {
    slug: "parrillas",
    title: "Parrillas",
    kicker: "Fuego y sombra",
    summary: "Parrillas numeradas, palapas del sector gazebo y una parrilla en cada bungalow.",
    reserve: { visita: "restaurante", intereses: ["restaurante"] },
    banner: {
      src: "/covers/parrillas.jpg",
      alt: "Carne y achuras sobre la parrilla, con el fuego atrás.",
      position: "center 38%",
    },
    intro:
      "El fuego y la sombra están en el predio, al lado del día de agua y de altura. Hay tres variantes. Un sector de parrillas numeradas para quien pasa el día. Un sector de palapas —en el predio se llaman gazebos— con sombra y mesa. Y cuatro bungalows, cada uno con parrilla propia. Se puede traer comida y bebida. El fogón del campamento es otra cosa: lo arma el personal en la jornada del curso, y queda en el sector de carpas.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "El fuego queda en la parrilla. Las palapas son sombra y mesa.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Para el grupo que pasa el día, y para quien se queda en un bungalow.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Uso del sector, sin guía. El fogón de campamento sí lo coordina el personal.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Durante la visita. Findes y feriados, el predio abre de 10:00 a 19:00.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Parrillas del día, palapas y parrilla de cada bungalow.",
      },
    ],
    subactivities: [
      {
        slug: "parrillas",
        name: "Parrillas",
        chip: "Parrillas",
        how: "Puestos numerados en un sector del predio. Cada grupo usa el fuego de su parrilla y puede llegar con la comida y la bebida de casa. El sector está en el campo, cerca de la mesa y de las palapas. Si falta algo en el medio del día, la proveeduría está en el mismo predio.",
        photos: [
          {
            src: "/parrilla.jpg",
            alt: "Carne asada a la parrilla, ya cortada.",
            position: "center",
          },
          {
            src: "/activities/restaurante.jpg",
            alt: "Techos, estacionamiento y el agua vistos desde arriba en el predio.",
            position: "center",
          },
        ],
      },
      {
        slug: "palapas",
        name: "Palapas",
        chip: "Palapas",
        how: "Sombra y mesa para quedarse afuera. En el predio este sector se llama gazebo: techos en el campo, cerca del agua y del día de pileta. Acá los mostramos como palapas para ubicarlos en el plano. Son para estar, y el fuego queda en las parrillas.",
        photos: [
          {
            src: "/activities/bungalows.jpg",
            alt: "Gazebo de techo anaranjado en la pradera del predio, con el monte detrás.",
            position: "center",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "El mismo tipo de gazebo visto desde arriba, entre el campo, las carpas y el agua.",
            position: "center 35%",
          },
        ],
      },
      {
        slug: "parrilla-de-bungalow",
        name: "Parrilla de bungalow",
        chip: "Bungalow",
        how: "Hay 4 bungalows, para 4 personas cada uno, con vista al lago. Cada casa tiene su parrilla, aparte de los puestos del día. Comparten pileta y un quincho con cocina. Esas cuatro parrillas son la cantidad fija de fuego en las casas. El sector numerado del día suma los puestos del predio para quien viene sin quedarse a dormir.",
        photos: [
          {
            src: "/bungalow.jpg",
            alt: "Casa de troncos entre árboles, imagen de los bungalows del predio.",
            position: "center",
          },
          {
            src: "/activities/bungalows.jpg",
            alt: "Campo del predio donde están las casas y el gazebo.",
            position: "center 40%",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Sector de parrillas",
        text: "Puestos numerados para el fuego de quien pasa el día.",
      },
      {
        name: "Palapas",
        text: "Sector gazebo: sombra y mesa en el campo.",
      },
      {
        name: "4 parrillas de bungalow",
        text: "Una por casa. Son cuatro bungalows, cuatro fuegos propios.",
      },
      {
        name: "Quincho con cocina",
        text: "Compartido por los bungalows, junto con la pileta de las casas.",
      },
      {
        name: "Proveeduría",
        text: "Por si falta algo mientras el grupo está en la parrilla o en la palapa.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "El fuego se hace en la parrilla del puesto, en el sector del día o en la parrilla del bungalow.",
      "Las parrillas del día están numeradas: cada grupo usa la suya.",
      "Las palapas son sombra y mesa. El fuego queda en las parrillas.",
      "Se puede traer comida y bebida. La proveeduría y el restaurante están en el mismo predio.",
      "El fogón del campamento lo coordina el personal, en el sector de carpas. Es distinto de estas parrillas.",
    ],
    grounds,
  },
  {
    slug: "bar",
    title: "Bar y restaurante",
    kicker: "Mesa",
    summary: "Restaurante, bar de playa y proveeduría, en el mismo predio que las parrillas.",
    reserve: { visita: "restaurante", intereses: ["restaurante"] },
    banner: {
      src: "/covers/restaurante.jpg",
      alt: "Mesa de madera servida con platos, cubiertos y copas en el restaurante.",
      position: "center 58%",
    },
    intro:
      "Se puede comer en el predio o traer la comida. Hay tres variantes de mesa: el restaurante, el bar de playa y la proveeduría. El restaurante es la mesa adentro. El bar es la barra de afuera, entre una actividad y la otra. La proveeduría cubre lo que falte en el medio del día. Los tres están junto al sector de parrillas y palapas. Los findes y feriados el predio abre de 10:00 a 19:00.",
    facts: [
      {
        id: "seguridad",
        label: "Seguridad",
        value: "Comedor y barra dentro del predio, con sanitarios y vestuario con duchas.",
      },
      {
        id: "edades",
        label: "Edades",
        value: "Para todo el grupo que está en el día.",
      },
      {
        id: "instructor",
        label: "Instructor",
        value: "Servicio de mesa, sin guía de actividad.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "En el día de predio: sábados, domingos y feriados, de 10:00 a 19:00.",
      },
      {
        id: "variantes",
        label: "Variantes",
        value: "Restaurante, bar de playa y proveeduría.",
      },
    ],
    subactivities: [
      {
        slug: "restaurante",
        name: "Restaurante",
        chip: "Restaurante",
        how: "La mesa del predio, para quien quiere comer ahí. La carta se conversa en el lugar: cambia, y por eso la ficha describe el servicio y no un menú fijo. Queda cerca de las parrillas, de las palapas y del agua. Quien prefiere, trae su comida y usa el sector de fuego.",
        photos: [
          {
            src: "/activities/restaurante.jpg",
            alt: "Construcciones con techo y el movimiento del predio vistos desde arriba.",
            position: "center 40%",
          },
        ],
      },
      {
        slug: "bar-de-playa",
        name: "Bar de playa",
        chip: "Bar de playa",
        how: "Barra cerca del agua, para el rato entre la pileta, el lago y la altura. Es el tramo de afuera de la mesa: se está en el día, sin sentarse al comedor. En verano queda junto a la playa. El resto del año sigue en el predio, del lado del agua.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Sector de agua y descanso, el entorno del bar de playa.",
            position: "center",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "El agua y el campo del predio, donde está la barra de afuera.",
            position: "center",
          },
        ],
      },
      {
        slug: "proveeduria",
        name: "Proveeduría",
        chip: "Proveeduría",
        how: "Un puesto para lo que falte en el medio del día: completa al restaurante y a quien trajo la comida de casa. Está en las instalaciones del predio, junto con sanitarios y vestuario con duchas.",
        photos: [
          {
            src: "/activities/restaurante.jpg",
            alt: "El núcleo de techos del predio, donde están la mesa y los servicios.",
            position: "center 30%",
          },
        ],
      },
    ],
    infrastructure: [
      {
        name: "Restaurante",
        text: "Mesa del predio para comer sin cocinar.",
      },
      {
        name: "Bar de playa",
        text: "Barra afuera, cerca del agua y del rato de pileta.",
      },
      {
        name: "Proveeduría",
        text: "Lo que falte durante el día, al lado de quien trae su comida.",
      },
      {
        name: "Sanitarios y vestuario",
        text: "Baños del predio y vestuario con duchas.",
      },
      {
        name: "Al lado del fuego",
        text: "Parrillas y palapas están en el mismo campo. El plano está en esa ficha.",
      },
    ],
    safetyTitle: "Seguridad e instrucciones",
    safety: [
      "El restaurante, el bar de playa y la proveeduría están dentro del predio.",
      "Se puede comer en la mesa o traer comida y bebida para las parrillas.",
      "Hay sanitarios y vestuario con duchas.",
      "El fuego y la sombra —parrillas numeradas, palapas y las 4 parrillas de bungalow— están en el plano de esa ficha.",
    ],
    grounds,
  },
]

function focusGrounds(
  featured: string[],
  copy: Pick<Grounds, "title" | "lede" | "total" | "highlights">,
): Grounds {
  const zoneBySpot: Record<string, ZoneId> = {
    bungalows: "bungalows",
    parque: "parque",
    palapas: "palapas",
    parrillas: "parrillas",
    canchas: "canchas",
    restaurante: "mesa",
    bar: "mesa",
    playa: "playa",
    lago: "lago",
    carpas: "carpas",
    dormis: "dormis",
  }
  const primary = featured.flatMap((id) => {
    const zone = zoneBySpot[id]
    return zone ? [zone] : []
  })
  return {
    ...copy,
    primary,
    photo: grounds.photo,
    spots: grounds.spots,
  }
}

export const stays: Category[] = [
  {
    slug: "bungalows",
    title: "Bungalows",
    kicker: "Estadía",
    summary: "Cuatro casas para cuatro personas, con vista al lago, parrilla propia y pileta compartida.",
    reserve: { visita: "bungalows", intereses: ["bungalows"] },
    banner: {
      src: "/activities/bungalows.jpg",
      alt: "Campo del predio con un gazebo de techo anaranjado y el monte detrás.",
      position: "center",
    },
    intro:
      "Hay cuatro bungalows y cada uno es para cuatro personas. Tienen baño privado, aire acondicionado, wi-fi y parrilla propia, con vista al lago. La pileta y el quincho con cocina se comparten. Entran el desayuno y las actividades que ese día se estén haciendo en el complejo. La fecha y el valor no se cierran en esta pantalla: los confirma el equipo.",
    facts: [
      {
        id: "seguridad",
        label: "La casa",
        value: "Baño privado, aire acondicionado y wi-fi en cada bungalow.",
      },
      {
        id: "edades",
        label: "Capacidad",
        value: "Cuatro personas por casa. Son cuatro casas.",
      },
      {
        id: "instructor",
        label: "El día",
        value: "Las actividades del complejo entran en la estadía y las guía el personal.",
      },
      {
        id: "horario",
        label: "Fecha",
        value: "Se confirma con el equipo. Acá no hay check-in publicado.",
      },
      {
        id: "variantes",
        label: "Afuera",
        value: "Parrilla propia y vista al lago. Pileta y quincho, compartidos.",
      },
    ],
    subactivities: [
      {
        slug: "la-casa",
        name: "La casa",
        chip: "4 personas",
        how: "Cada bungalow duerme a cuatro. Adentro hay baño privado, aire acondicionado y wi-fi. No es una habitación de hotel compartida con otra familia: la unidad es la casa.",
        photos: [
          {
            src: "/bungalow.jpg",
            alt: "Casa de troncos entre árboles, imagen de los bungalows del predio.",
            position: "center",
          },
          {
            src: "/activities/bungalows.jpg",
            alt: "El campo donde están las casas, con un gazebo y el monte detrás.",
            position: "center 40%",
          },
        ],
      },
      {
        slug: "afuera",
        name: "Afuera",
        chip: "Parrilla propia",
        how: "Las cuatro miran al lago y cada una tiene parrilla propia. Esas cuatro parrillas son distintas del sector numerado de quien pasa el día. El fuego de la casa queda en la casa.",
        photos: [
          {
            src: "/lago.jpg",
            alt: "El lago al que miran los bungalows.",
            position: "center 40%",
          },
          {
            src: "/parrilla.jpg",
            alt: "Fuego y comida a la parrilla.",
            position: "center",
          },
        ],
      },
      {
        slug: "en-comun",
        name: "En común",
        chip: "Pileta compartida",
        how: "La pileta no es privada de una sola casa: la comparten los bungalows. El quincho con cocina también. El desayuno está incluido, y también las actividades que ese día haya en el complejo.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Agua del predio, cerca del sector para quedarse.",
            position: "center",
          },
          {
            src: "/activities/restaurante.jpg",
            alt: "Techos del predio vistos desde arriba, junto al agua.",
            position: "center",
          },
        ],
      },
    ],
    infrastructure: [
      { name: "4 bungalows", text: "Cuatro unidades, cuatro personas en cada una." },
      { name: "Baño privado", text: "Uno por casa." },
      { name: "Aire y wi-fi", text: "En cada bungalow." },
      { name: "Parrilla propia", text: "Una por casa, aparte de las parrillas del día." },
      { name: "Vista al lago", text: "Las cuatro miran al agua." },
      { name: "Pileta compartida", text: "Del sector de las casas, no de una sola." },
      { name: "Quincho con cocina", text: "Se usa en común." },
      { name: "Desayuno", text: "Incluido en la estadía." },
      { name: "Actividades del día", text: "Las que ese día se estén haciendo en el complejo." },
    ],
    safetyTitle: "Antes de quedarse",
    safety: [
      "Son cuatro casas y no hay una quinta publicada.",
      "La pileta y el quincho se comparten. La parrilla y el baño, no.",
      "El desayuno y las actividades del día entran. El valor se consulta: no está en esta página.",
      "La fecha queda firme cuando el equipo la confirma.",
    ],
    grounds: focusGrounds(["bungalows", "lago"], {
      title: "Cuatro casas, del lado del lago",
      lede: "El plano orienta. No es una medición: muestra que hay cuatro bungalows juntos, mirando al agua, y aparte el fuego de quien solo pasa el día.",
      total: "4 bungalows. 4 personas en cada uno. 4 parrillas propias.",
      highlights: [
        { count: "4", label: "Bungalows" },
        { count: "4", label: "Personas por casa" },
        { count: "1", label: "Parrilla propia en cada una" },
      ],
    }),
  },
  {
    slug: "campamento",
    title: "Campamento",
    kicker: "Estadía",
    summary: "Tres formas de traer al grupo: jornada de aventura, carpa o dormis.",
    reserve: { visita: "campamento", intereses: ["campamentos"] },
    banner: {
      src: "/covers/campamento.jpg",
      alt: "Carpas armadas en el césped del sector de campamento, entre los árboles.",
      position: "center 45%",
    },
    intro:
      "El campamento estudiantil no es una sola cama. Hay tres formas: jornada de aventura, para pasar el día y volver; campamento en carpa; y campamento en dormis. Tirolesa, parque aéreo, palestra, péndulo, remo y caminata los guía el personal. El fogón se conversa con el equipo. Si es un viaje de egresados o una salida educativa, se arma igual: fecha, cantidad y edades. Cuántas plazas hay en los dormis, o cuántas carpas entran esa fecha, se confirma al reservar.",
    facts: [
      {
        id: "seguridad",
        label: "Cuidado",
        value: "Altura, remo y caminata van con el personal. El fogón también lo coordina el equipo.",
      },
      {
        id: "edades",
        label: "El grupo",
        value: "Cursos, egresados o salida educativa. En la consulta van cantidad y edades.",
      },
      {
        id: "instructor",
        label: "Guía",
        value: "El personal del predio abre los turnos de aventura.",
      },
      {
        id: "horario",
        label: "Armado",
        value: "La jornada y la noche se cierran con la fecha. No hay un cronograma fijo publicado.",
      },
      {
        id: "variantes",
        label: "Tres formas",
        value: "Jornada de aventura, carpa o dormis.",
      },
    ],
    subactivities: [
      {
        slug: "jornada-de-aventura",
        name: "Jornada de aventura",
        chip: "Pasar el día",
        how: "Un día entero en el predio, sin quedarse a dormir. Llegan de mañana y se van con el día cumplido. Adentro entran las actividades guiadas: tirolesa, parque aéreo, palestra, péndulo, remo y caminata. El menú exacto de esa fecha se cierra con el equipo. Es la forma para el curso que no pernocta.",
        photos: [
          {
            src: "/parque.jpg",
            alt: "Actividad de altura, con arnés, en el predio.",
            position: "left center",
          },
          {
            src: "/lago.jpg",
            alt: "El lago, donde el grupo rema en el turno del día.",
            position: "center",
          },
        ],
      },
      {
        slug: "campamento-en-carpa",
        name: "Campamento en carpa",
        chip: "Carpa",
        how: "La noche se queda en el predio. El sector de carpas está junto al agua. El fogón entra en la conversación con el equipo: no es una fogata en cualquier rincón. La cantidad de carpas de esa fecha no está publicada y se confirma al reservar.",
        photos: [
          {
            src: "/activities/campamentos.jpg",
            alt: "Carpas del predio vistas desde arriba, entre el campo y el agua.",
            position: "center",
          },
          {
            src: "/activities/canotaje.jpg",
            alt: "Orilla del agua con el sector de carpas arriba.",
            position: "center",
          },
        ],
      },
      {
        slug: "campamento-en-dormis",
        name: "Campamento en dormis",
        chip: "Dormis",
        how: "Para el grupo que quiere cama y no carpa. Es un sector de noche, distinto de las carpas y distinto de los cuatro bungalows. Qué hay adentro de cada dormi, y cuántas plazas entran, no está publicado: lo dice el equipo al confirmar la fecha.",
        photos: [
          {
            src: "/activities/bungalows.jpg",
            alt: "Campo y construcciones del predio, donde se arma la noche del grupo.",
            position: "center",
          },
          {
            src: "/canchas.jpg",
            alt: "Parte del predio que el grupo usa durante el día de campamento.",
            position: "center",
          },
        ],
      },
    ],
    infrastructure: [
      { name: "Jornada de aventura", text: "El día completo, sin pernocte." },
      { name: "Carpas", text: "Sector de noche. El cupo de la fecha se consulta." },
      { name: "Dormis", text: "Cama para el grupo. El interior se confirma al reservar." },
      { name: "Fogón", text: "Lo coordina el personal. Se pide con el campamento." },
      { name: "Altura", text: "Tirolesa, parque aéreo, palestra y péndulo, con arnés y turno." },
      { name: "Remo", text: "Kayak triplo y canoa, con el personal en el agua." },
      { name: "Caminata", text: "Circuito por el predio, con alguien del equipo adelante." },
    ],
    safetyTitle: "Cómo se arma el grupo",
    safety: [
      "Hay tres formas. Elegir una en esta ficha no reserva la fecha: la confirma el equipo.",
      "En la consulta van cantidad, edades y qué no puede faltar.",
      "Las actividades de altura, agua y caminata las guía el personal. No se recorren solas.",
      "El fogón no es libre. Se coordina con el equipo.",
      "Plazas de dormis y cantidad de carpas se confirman con la fecha. No las publicamos como un número fijo.",
    ],
    grounds: focusGrounds(["carpas", "dormis"], {
      title: "Dónde pasa la noche el grupo",
      lede: "La jornada de aventura no ocupa una cama: el grupo usa el predio y vuelve. Carpas y dormis son los dos sectores de noche. El plano orienta; no dice la parcela ni el cupo de ese día.",
      total: "3 formas: jornada sin dormir, carpa o dormis.",
      highlights: [
        { count: "3", label: "Formas de campamento" },
        { count: "Día", label: "Jornada, sin cama" },
        { count: "Noche", label: "Carpa o dormis" },
      ],
    }),
  },
  {
    slug: "pasar-el-dia",
    title: "Pasar el día",
    kicker: "Estadía",
    summary: "El predio de mañana a tarde, sin bungalow, carpa ni dormi.",
    reserve: { visita: "familia", intereses: [] },
    banner: {
      src: "/activities/canotaje.jpg",
      alt: "El agua del predio en un día de visita, con la orilla y las carpas de fondo.",
      position: "center",
    },
    intro:
      "Se llega, se usa el predio y se vuelve. No hay casa, carpa ni dormi asignados. En familia es un día con turno para lo guiado —remo y altura— y rato libre en canchas y plaza. Si es un curso, esa misma idea tiene nombre: jornada de aventura, una de las tres formas del campamento. Los findes y feriados el predio abre de 10:00 a 19:00. El sector de comida —parrilla, restaurante, gazebo o la vianda— se acuerda al reservar. Si vienen con mascota, entra con correa y no paga. Si alguien tiene certificado CUD, se dice en la reserva.",
    facts: [
      {
        id: "seguridad",
        label: "El día",
        value: "Lo guiado va con el personal. Canchas y plaza no piden un turno aparte.",
      },
      {
        id: "edades",
        label: "Quién viene",
        value: "Familias, o un curso que vuelve a dormir a otro lado.",
      },
      {
        id: "instructor",
        label: "Staff",
        value: "Abre remo y altura. El rato libre del predio no.",
      },
      {
        id: "horario",
        label: "Horario",
        value: "Findes y feriados, el predio abre de 10:00 a 19:00.",
      },
      {
        id: "variantes",
        label: "Sin pernocte",
        value: "Día en familia, o jornada de aventura si es un curso.",
      },
    ],
    subactivities: [
      {
        slug: "en-familia",
        name: "En familia",
        chip: "Familia",
        how: "Un día de predio, no una entrada suelta. Las actividades con staff tienen turno. Las canchas y la plaza, no. Si traen mascota, entra con correa y no paga. El sector de la mesa se deja hablado antes de llegar. También pueden traer la comida.",
        photos: [
          {
            src: "/playa.jpg",
            alt: "Sector de agua del predio para un día en familia.",
            position: "center",
          },
          {
            src: "/canchas.jpg",
            alt: "Canchas para el rato libre del día.",
            position: "center",
          },
        ],
      },
      {
        slug: "curso-de-un-dia",
        name: "Curso de un día",
        chip: "Jornada",
        how: "La jornada de aventura es la forma de campamento sin noche: el curso llega de mañana y se va con el día cumplido. Tirolesa, parque aéreo, palestra, péndulo, remo y caminata los guía el personal. El detalle de esa salida está en la ficha de campamento. En el formulario, si es un curso, el tipo de visita se cambia a campamento estudiantil.",
        photos: [
          {
            src: "/parque.jpg",
            alt: "Altura guiada, parte de una jornada de un día.",
            position: "center",
          },
          {
            src: "/activities/campamentos.jpg",
            alt: "El predio desde arriba, como lo recorre un grupo de un día.",
            position: "center 30%",
          },
        ],
      },
      {
        slug: "la-mesa",
        name: "La mesa",
        chip: "Sin pernocte",
        how: "Comen en el restaurante, en el bar de playa, en una parrilla del día, bajo una palapa, o con lo que trajeron. Ninguna de esas mesas incluye quedarse a dormir. El sector se pide con la visita.",
        photos: [
          {
            src: "/parrilla.jpg",
            alt: "Parrilla para el grupo que pasa el día y no se queda.",
            position: "center",
          },
          {
            src: "/activities/restaurante.jpg",
            alt: "Techos del restaurante y el predio vistos desde arriba.",
            position: "center",
          },
        ],
      },
    ],
    infrastructure: [
      { name: "Sin cama", text: "No hay bungalow, carpa ni dormi en esta opción." },
      { name: "Turnos guiados", text: "Remo y altura, con el personal y dentro del día." },
      { name: "Rato libre", text: "Canchas y plaza, con la visita reservada." },
      { name: "Mesa", text: "Restaurante, bar, parrilla, palapa o comida propia." },
      { name: "Mascota", text: "Entra con correa y no paga entrada." },
      { name: "Horario de finde", text: "Sábados, domingos y feriados, de 10:00 a 19:00." },
    ],
    safetyTitle: "Lo que esta opción no es",
    safety: [
      "No asigna una casa ni una carpa. Si se quedan a dormir, la ficha es bungalows o campamento.",
      "El día en familia y la jornada de un curso no se reservan igual: en el formulario se elige el tipo de visita.",
      "Lo guiado espera el turno del staff. Las canchas no.",
      "La fecha se confirma por teléfono. Esta ficha no la deja firme.",
    ],
    grounds: focusGrounds(["lago", "parque", "canchas", "playa", "parrillas", "restaurante", "bar"], {
      title: "El día usa el predio entero",
      lede: "No hay una unidad marcada porque nadie se queda a dormir. El plano muestra los sectores por los que se mueve la visita: agua, altura, canchas y mesa.",
      total: "Sin pernocte. El predio, de 10:00 a 19:00 los findes y feriados.",
      highlights: [
        { count: "0", label: "Camas en esta opción" },
        { count: "Día", label: "Se vuelve a la noche" },
        { count: "10–19", label: "Findes y feriados" },
      ],
    }),
  },
]

const stayBySlug = new Map(stays.map((stay) => [stay.slug, stay]))

export function getStay(slug: string) {
  return stayBySlug.get(slug)
}

const bySlug = new Map(categories.map((category) => [category.slug, category]))

export function getCategory(slug: string) {
  return bySlug.get(slug)
}

export function reserveHref(item: { reserve?: { visita?: VisitType; intereses: string[] } }) {
  const params = new URLSearchParams()
  if (item.reserve?.visita) params.set("visita", item.reserve.visita)
  if (item.reserve && item.reserve.intereses.length > 0) {
    params.set("interes", item.reserve.intereses.join(","))
  }
  const query = params.toString()
  return query ? `/reserva?${query}` : "/reserva"
}

export const activityRedirects: Record<string, string> = {
  canotaje: "/categorias/lago",
  "pileta-natural": "/categorias/playa",
  tirolesa: "/categorias/parque-aereo",
  "parque-aereo": "/categorias/parque-aereo",
  palestra: "/categorias/parque-aereo",
  pendulo: "/categorias/parque-aereo",
  caminata: "/categorias/canchas",
  canchas: "/categorias/canchas",
  "plaza-infantil": "/categorias/canchas",
  fogon: "/estadia/campamento",
  "jornada-de-aventura": "/estadia/campamento#jornada-de-aventura",
}
