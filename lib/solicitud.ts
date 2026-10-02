import {
  horas,
  infoLugar,
  mesaDe,
  unidadDe,
  unidadesDe,
  type Mesa,
  type Unidad,
} from "@/lib/inventario"
import {
  EDAD_MAXIMA_MENOR,
  EDAD_MINIMA_CON_CARGO,
  bandaDeEdad,
  conDescuentoEfectivo,
  pesos,
  precioBungalowPorNoche,
  repartirEnBungalows,
  tarifas,
} from "@/lib/predio/tarifas"

export const MAX_NOCHES = 14

export type TipoGrupo = "familiar" | "estudiantil"
export type Estadia = "dia" | "noche"

export type PersonaBorrador = {
  id: string
  nombre: string
  apellido: string
  dni: string
  edad: string
  notas: string
  cud: boolean
}

export type FamiliaBorrador = {
  id: string
  responsable: PersonaBorrador
  integrantes: PersonaBorrador[]
}

export type Borrador = {
  tipo: TipoGrupo | ""
  contacto: { nombre: string; apellido: string; email: string; telefono: string }
  estadia: Estadia | ""
  desde: string
  hasta: string
  ingreso: string
  salida: string
  familias: FamiliaBorrador[]
  lugares: string[]
  restaurante: "" | "si" | "no"
  mesasRestaurante: string[]
  bar: "" | "si" | "no"
  mesasBar: string[]
  institucion: string
  cargo: string
  estudiantes: string
  adultos: string
  cudEstudiantes: string
  edadesGrupo: string
  notasGrupo: string
  responsableInstitucion: PersonaBorrador
}

export type PersonaLista = {
  nombre: string
  apellido: string
  dni: string
  edad: number
  notas: string
  cud: boolean
  rol: string
}

export type FamiliaLista = {
  responsable: PersonaLista
  integrantes: PersonaLista[]
}

export type LineaPrecio = {
  concepto: string
  detalle: string
  importe: number
}

export type SolicitudGuardada = {
  version: 1
  codigo: string
  tipo: TipoGrupo
  contacto: Borrador["contacto"]
  estadia: Estadia
  desde: string
  hasta: string
  ingreso: string
  salida: string
  dias: string[]
  noches: number
  familias: FamiliaLista[]
  institucion: {
    nombre: string
    cargo: string
    estudiantes: number
    adultos: number
    cud: number
    edades: string
    notas: string
    responsable: PersonaLista
  } | null
  lugares: Unidad[]
  mesas: Mesa[]
  personas: number
  cotizacion: Cotizacion
}

export type Cotizacion = {
  total: number
  totalEfectivo?: number
  aConfirmar?: boolean
  lineas: LineaPrecio[]
}

export type Errores = Record<string, string>

export function personaVacia(): PersonaBorrador {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p-${Math.random().toString(36).slice(2)}`
  return { id, nombre: "", apellido: "", dni: "", edad: "", notas: "", cud: false }
}

export function familiaVacia(): FamiliaBorrador {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `f-${Math.random().toString(36).slice(2)}`
  return { id, responsable: personaVacia(), integrantes: [] }
}

export function borradorInicial(): Borrador {
  return {
    tipo: "",
    contacto: { nombre: "", apellido: "", email: "", telefono: "", },
    estadia: "",
    desde: "",
    hasta: "",
    ingreso: "10:00",
    salida: "18:00",
    familias: [familiaVacia()],
    lugares: [],
    restaurante: "",
    mesasRestaurante: [],
    bar: "",
    mesasBar: [],
    institucion: "",
    cargo: "",
    estudiantes: "",
    adultos: "",
    cudEstudiantes: "0",
    edadesGrupo: "",
    notasGrupo: "",
    responsableInstitucion: personaVacia(),
  }
}

const fechaDelPredio = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })

export function hoyIso() {
  return fechaDelPredio.format(new Date())
}

export function sumarDias(iso: string, dias: number) {
  const [anio, mes, dia] = iso.split("-").map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  fecha.setDate(fecha.getDate() + dias)
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${fecha.getFullYear()}-${m}-${d}`
}

export function diasDelRango(desde: string, hasta: string) {
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde) return []
  const dias: string[] = []
  let cursor = desde
  while (cursor <= hasta) {
    dias.push(cursor)
    if (dias.length > 40) break
    cursor = sumarDias(cursor, 1)
  }
  return dias
}

export function esFecha(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [anio, mes, dia] = valor.split("-").map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
}

export function fechaLarga(iso: string) {
  if (!esFecha(iso)) return iso
  const [anio, mes, dia] = iso.split("-").map(Number)
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function fechaCorta(iso: string) {
  if (!esFecha(iso)) return iso
  const [anio, mes, dia] = iso.split("-").map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  })
}

function digitos(valor: string) {
  return (valor.match(/\d/g) ?? []).length
}

function limpiarDni(valor: string) {
  return valor.replace(/\D/g, "")
}

export function personasDeFamilias(familias: FamiliaBorrador[]) {
  return familias.flatMap((familia) => [familia.responsable, ...familia.integrantes])
}

export function cantidadPersonas(borrador: Borrador) {
  if (borrador.tipo !== "familiar" && borrador.tipo !== "estudiantil") return 0
  if (borrador.tipo === "estudiantil") {
    const estudiantes = Number(borrador.estudiantes)
    const adultos = Number(borrador.adultos)
    const a = Number.isInteger(estudiantes) && estudiantes > 0 ? estudiantes : 0
    const b = Number.isInteger(adultos) && adultos > 0 ? adultos : 0
    return a + b
  }
  return personasDeFamilias(borrador.familias).filter((persona) => persona.nombre.trim().length >= 2).length
}

function validarPersona(persona: PersonaBorrador, clave: string, errores: Errores) {
  if (persona.nombre.trim().length < 2) errores[`${clave}.nombre`] = "Falta el nombre."
  if (persona.apellido.trim().length < 2) errores[`${clave}.apellido`] = "Falta el apellido."
  const dni = limpiarDni(persona.dni)
  if (!/^\d{7,8}$/.test(dni)) errores[`${clave}.dni`] = "El DNI tiene 7 u 8 números."
  if (!/^\d{1,3}$/.test(persona.edad.trim())) {
    errores[`${clave}.edad`] = "Indicá la edad en años."
  } else {
    const edad = Number(persona.edad)
    if (edad > 120) errores[`${clave}.edad`] = "Revisá la edad."
  }
  if (persona.notas.trim().length > 400) errores[`${clave}.notas`] = "Dejalo en unas líneas."
}

function validarContacto(borrador: Borrador, errores: Errores) {
  if (borrador.contacto.nombre.trim().length < 2) errores["contacto.nombre"] = "Falta el nombre."
  if (borrador.contacto.apellido.trim().length < 2) errores["contacto.apellido"] = "Falta el apellido."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(borrador.contacto.email.trim())) {
    errores["contacto.email"] = "Ese correo no parece completo."
  }
  if (digitos(borrador.contacto.telefono) < 8) {
    errores["contacto.telefono"] = "El teléfono necesita al menos 8 números."
  }
}

function validarTiempo(borrador: Borrador, errores: Errores) {
  if (borrador.estadia !== "dia" && borrador.estadia !== "noche") {
    errores.estadia = "Elegí si pasan el día o se quedan a dormir."
    return
  }
  if (!esFecha(borrador.desde) || borrador.desde < hoyIso()) {
    errores.desde = "Elegí un día de hoy en adelante."
  }
  if (borrador.estadia === "dia") {
    if (borrador.desde && borrador.hasta && borrador.hasta !== borrador.desde) {
      errores.hasta = "Para pasar el día se elige una sola fecha."
    }
  } else if (!esFecha(borrador.hasta) || borrador.hasta <= borrador.desde) {
    errores.hasta = "La salida tiene que ser al menos el día siguiente."
  } else if (diasDelRango(borrador.desde, borrador.hasta).length - 1 > MAX_NOCHES) {
    errores.hasta = `La estadía puede pedirse hasta ${MAX_NOCHES} noches.`
  }
  if (!horas.includes(borrador.ingreso)) errores.ingreso = "Elegí un horario de ingreso."
  if (!horas.includes(borrador.salida)) errores.salida = "Elegí un horario de salida."
  if (
    borrador.estadia === "dia" &&
    horas.includes(borrador.ingreso) &&
    horas.includes(borrador.salida) &&
    borrador.salida <= borrador.ingreso
  ) {
    errores.salida = "La salida tiene que ser después del ingreso."
  }
}

export function necesariosDe(personas: number, capacidad: number) {
  if (personas < 1 || capacidad < 1) return 0
  return Math.ceil(personas / capacidad)
}

export function advertenciaCapacidad(opciones: {
  personas: number
  capacidad: number
  elegidas: number
  total: number
  singular: string
  plural: string
  genero?: "f" | "m"
}) {
  const { personas, capacidad, elegidas, total, singular, plural, genero = "f" } = opciones
  if (elegidas < 1 || personas < 1) return null
  const necesarias = necesariosDe(personas, capacidad)
  if (elegidas >= necesarias) return null
  if (necesarias > total) {
    const hay =
      total === 1
        ? `Hay ${genero === "m" ? "un solo" : "una sola"} ${singular}`
        : `Hay ${total} ${plural}`
    return `Declaraste ${personas} personas y la capacidad por ${singular} es para ${capacidad}. ${hay} y no alcanza para todo el grupo.`
  }
  const faltan = necesarias - elegidas
  if (faltan === 1) {
    const una = genero === "m" ? "un" : "una"
    return `Reservá ${una} ${singular} más: declaraste ${personas} personas y la capacidad por ${singular} es para ${capacidad}.`
  }
  return `Reservá ${faltan} ${plural} más: declaraste ${personas} personas y la capacidad por ${singular} es para ${capacidad}.`
}

export function validarPaso(paso: string, borrador: Borrador, ocupados: string[] = []): Errores {
  const errores: Errores = {}

  if (paso === "grupo") {
    if (borrador.tipo !== "familiar" && borrador.tipo !== "estudiantil") {
      errores.tipo = "Elegí cómo es el grupo para seguir."
    }
    return errores
  }

  if (paso === "personas") {
    const dnis = new Set<string>()
    borrador.familias.forEach((familia, indice) => {
      validarPersona(familia.responsable, `familias.${indice}.responsable`, errores)
      const dniResponsable = limpiarDni(familia.responsable.dni)
      if (/^\d{7,8}$/.test(dniResponsable)) {
        if (dnis.has(dniResponsable)) errores[`familias.${indice}.responsable.dni`] = "Ese DNI ya está en la reserva."
        dnis.add(dniResponsable)
      }
      familia.integrantes.forEach((persona, hijo) => {
        validarPersona(persona, `familias.${indice}.integrantes.${hijo}`, errores)
        const dni = limpiarDni(persona.dni)
        if (/^\d{7,8}$/.test(dni)) {
          if (dnis.has(dni)) errores[`familias.${indice}.integrantes.${hijo}.dni`] = "Ese DNI ya está en la reserva."
          dnis.add(dni)
        }
      })
    })
    if (borrador.familias.length < 1) errores.familias = "Cargá al menos una familia."
    return errores
  }

  if (paso === "institucion") {
    if (borrador.institucion.trim().length < 2) errores.institucion = "Falta el nombre de la institución."
    if (borrador.cargo.trim().length < 2) errores.cargo = "Indicá el cargo de quien reserva."
    validarPersona(borrador.responsableInstitucion, "responsableInstitucion", errores)
    const estudiantes = Number(borrador.estudiantes)
    const adultos = Number(borrador.adultos)
    const cud = Number(borrador.cudEstudiantes || "0")
    if (!Number.isInteger(estudiantes) || estudiantes < 1 || estudiantes > 400) {
      errores.estudiantes = "Indicá cuántos estudiantes ingresan."
    }
    if (!Number.isInteger(adultos) || adultos < 1 || adultos > 80) {
      errores.adultos = "Tiene que haber al menos un adulto a cargo."
    }
    if (!Number.isInteger(cud) || cud < 0 || (Number.isInteger(estudiantes) && cud > estudiantes)) {
      errores.cudEstudiantes = "No puede haber más certificados CUD que estudiantes."
    }
    if (borrador.edadesGrupo.trim().length < 2) errores.edadesGrupo = "Contanos las edades del grupo."
    if (borrador.notasGrupo.trim().length > 800) errores.notasGrupo = "Dejalo en unas líneas."
    validarContacto(
      {
        ...borrador,
        contacto: {
          nombre: borrador.responsableInstitucion.nombre,
          apellido: borrador.responsableInstitucion.apellido,
          email: borrador.contacto.email,
          telefono: borrador.contacto.telefono,
        },
      },
      errores,
    )
    delete errores["contacto.nombre"]
    delete errores["contacto.apellido"]
    return errores
  }

  if (paso === "tiempo") {
    validarTiempo(borrador, errores)
    return errores
  }

  if (paso === "lugar") {
    const personas = cantidadPersonas(borrador)
    if (borrador.lugares.length < 1) {
      errores.lugares = "Elegí al menos un lugar para el grupo."
      return errores
    }
    const tipos = new Set(borrador.lugares.map((id) => unidadDe(id)?.tipo).filter(Boolean))
    for (const tipo of tipos) {
      if (!tipo) continue
      const info = infoLugar(tipo)
      if (info.soloHospedaje && borrador.estadia !== "noche") {
        errores.lugares = "Los bungalows son para quedarse a dormir."
      }
      const elegidas = borrador.lugares.filter((id) => unidadDe(id)?.tipo === tipo)
      const aviso = advertenciaCapacidad({
        personas,
        capacidad: info.capacidad,
        elegidas: elegidas.length,
        total: unidadesDe(tipo).length,
        singular: info.singular,
        plural: info.plural,
        genero: info.genero,
      })
      if (aviso) errores[`lugar.${tipo}`] = aviso
    }
    if (borrador.lugares.some((id) => ocupados.includes(id) || !unidadDe(id))) {
      errores.lugares = "Hay un lugar que ya no está libre. Elegí otro."
    }
    return errores
  }

  if (paso === "mesa") {
    const personas = cantidadPersonas(borrador)
    if (borrador.restaurante !== "si" && borrador.restaurante !== "no") {
      errores.restaurante = "Respondé si quieren mesa en el restaurante."
    }
    if (borrador.bar !== "si" && borrador.bar !== "no") {
      errores.bar = "Respondé si quieren mesa en el bar."
    }
    if (borrador.restaurante === "si") {
      const error = avisoMesas(personas, borrador.mesasRestaurante, "restaurante", ocupados)
      if (error) errores.mesasRestaurante = error
    }
    if (borrador.bar === "si") {
      const error = avisoMesas(personas, borrador.mesasBar, "bar", ocupados)
      if (error) errores.mesasBar = error
    }
    return errores
  }

  if (paso === "confirmar") {
    if (borrador.tipo === "familiar") validarContacto(borrador, errores)
    return errores
  }

  return errores
}

function avisoMesas(personas: number, ids: string[], zona: "restaurante" | "bar", ocupados: string[]) {
  const nombre = zona === "restaurante" ? "restaurante" : "bar"
  if (ids.length < 1) return `Elegí al menos una mesa del ${nombre}, o marcá que no.`
  if (ids.some((id) => ocupados.includes(id) || !mesaDe(id) || mesaDe(id)?.zona !== zona)) {
    return "Hay una mesa que ya no está libre. Elegí otra."
  }
  const lugares = ids.reduce((suma, id) => suma + (mesaDe(id)?.capacidad ?? 0), 0)
  if (lugares < personas) {
    return `Sumá otra mesa: declaraste ${personas} personas y las mesas elegidas alcanzan para ${lugares}.`
  }
  return null
}

function aPersona(persona: PersonaBorrador, rol: string): PersonaLista {
  return {
    nombre: persona.nombre.trim(),
    apellido: persona.apellido.trim(),
    dni: limpiarDni(persona.dni),
    edad: Number(persona.edad),
    notas: persona.notas.trim(),
    cud: persona.cud,
    rol,
  }
}

export function hastaEfectivo(borrador: Borrador) {
  if (borrador.estadia === "dia") return borrador.desde
  return borrador.hasta
}

export function prepararBorrador(borrador: Borrador): Borrador {
  const copia: Borrador = {
    ...borrador,
    contacto: { ...borrador.contacto },
    lugares: [...borrador.lugares],
    mesasRestaurante: [...borrador.mesasRestaurante],
    mesasBar: [...borrador.mesasBar],
    familias: borrador.familias,
    responsableInstitucion: borrador.responsableInstitucion,
  }
  if (copia.estadia === "dia") copia.hasta = copia.desde
  if (copia.restaurante !== "si") copia.mesasRestaurante = []
  if (copia.bar !== "si") copia.mesasBar = []
  if (copia.tipo !== "familiar") {
    copia.lugares = []
    copia.mesasRestaurante = []
    copia.mesasBar = []
  }
  if (copia.estadia !== "noche") {
    copia.lugares = copia.lugares.filter((id) => unidadDe(id)?.tipo !== "bungalow")
  }
  return copia
}

export function compilar(borrador: Borrador, codigo: string): SolicitudGuardada | null {
  if (borrador.tipo !== "familiar" && borrador.tipo !== "estudiantil") return null
  if (borrador.estadia !== "dia" && borrador.estadia !== "noche") return null
  const hasta = hastaEfectivo(borrador)
  const dias = diasDelRango(borrador.desde, hasta)
  if (dias.length < 1) return null
  const noches = borrador.estadia === "noche" ? dias.length - 1 : 0

  const familias: FamiliaLista[] =
    borrador.tipo === "familiar"
      ? borrador.familias.map((familia, indice) => ({
          responsable: aPersona(familia.responsable, `Responsable, familia ${indice + 1}`),
          integrantes: familia.integrantes.map((persona) => aPersona(persona, `Familia ${indice + 1}`)),
        }))
      : []

  const institucion =
    borrador.tipo === "estudiantil"
      ? {
          nombre: borrador.institucion.trim(),
          cargo: borrador.cargo.trim(),
          estudiantes: Number(borrador.estudiantes),
          adultos: Number(borrador.adultos),
          cud: Number(borrador.cudEstudiantes || "0"),
          edades: borrador.edadesGrupo.trim(),
          notas: borrador.notasGrupo.trim(),
          responsable: aPersona(borrador.responsableInstitucion, borrador.cargo.trim() || "Responsable"),
        }
      : null

  const lugares = borrador.tipo === "familiar" ? borrador.lugares.map((id) => unidadDe(id)).filter((item): item is Unidad => !!item) : []
  const mesasElegidas =
    borrador.tipo === "familiar"
      ? [...borrador.mesasRestaurante, ...borrador.mesasBar].map((id) => mesaDe(id)).filter((item): item is Mesa => !!item)
      : []

  const contacto =
    borrador.tipo === "estudiantil"
      ? {
          nombre: borrador.responsableInstitucion.nombre.trim(),
          apellido: borrador.responsableInstitucion.apellido.trim(),
          email: borrador.contacto.email.trim(),
          telefono: borrador.contacto.telefono.trim(),
        }
      : {
          nombre: borrador.contacto.nombre.trim(),
          apellido: borrador.contacto.apellido.trim(),
          email: borrador.contacto.email.trim(),
          telefono: borrador.contacto.telefono.trim(),
        }

  const personas =
    borrador.tipo === "estudiantil"
      ? (institucion?.estudiantes ?? 0) + (institucion?.adultos ?? 0)
      : familias.reduce((suma, familia) => suma + 1 + familia.integrantes.length, 0)

  const solicitud: SolicitudGuardada = {
    version: 1,
    codigo,
    tipo: borrador.tipo,
    contacto,
    estadia: borrador.estadia,
    desde: borrador.desde,
    hasta,
    ingreso: borrador.ingreso,
    salida: borrador.salida,
    dias,
    noches,
    familias,
    institucion,
    lugares,
    mesas: mesasElegidas,
    personas,
    cotizacion: { total: 0, lineas: [] },
  }
  solicitud.cotizacion = cotizar(solicitud)
  return solicitud
}

export function textoDelTotal(cotizacion: Cotizacion) {
  return cotizacion.aConfirmar ? "A confirmar" : pesos(cotizacion.total)
}

export function textoDelEfectivo(cotizacion: Cotizacion) {
  if (cotizacion.aConfirmar || !cotizacion.totalEfectivo || cotizacion.totalEfectivo === cotizacion.total) return null
  return `Pagando en efectivo: ${pesos(cotizacion.totalEfectivo)} (${tarifas.descuentoEfectivo * 100} % menos).`
}

function veces(cantidad: number, uno: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? uno : varios}`
}

export function cotizar(solicitud: SolicitudGuardada): Cotizacion {
  if (solicitud.tipo === "estudiantil") {
    return {
      total: 0,
      aConfirmar: true,
      lineas: [
        {
          concepto: "Presupuesto del grupo",
          detalle: "Lo arma el predio según la propuesta (aventura, carpa o dormis), la cantidad y las bonificaciones.",
          importe: 0,
        },
      ],
    }
  }

  const lineas: LineaPrecio[] = []
  const dias = Math.max(solicitud.dias.length, 1)
  const todas = solicitud.familias.flatMap((familia) => [familia.responsable, ...familia.integrantes])
  const bandas = todas.map((persona) => bandaDeEdad(persona.edad, persona.cud))
  const adultos = bandas.filter((banda) => banda === "adulto").length
  const menores = bandas.filter((banda) => banda === "menor").length
  const sinCargo = bandas.filter((banda) => banda === "sin-cargo").length
  const bungalows = solicitud.lugares.filter((lugar) => lugar.tipo === "bungalow")

  if (bungalows.length > 0) {
    const noches = Math.max(solicitud.noches, 1)
    const reparto = repartirEnBungalows(todas.length, bungalows.length)
    bungalows.forEach((bungalow, indice) => {
      lineas.push({
        concepto: capitalizar(bungalow.nombre),
        detalle: `${veces(reparto[indice], "persona", "personas")} × ${veces(noches, "noche", "noches")} · incluye la entrada`,
        importe: precioBungalowPorNoche(reparto[indice]) * noches,
      })
    })
  } else {
    if (adultos > 0) {
      lineas.push({
        concepto: "Ingreso adultos",
        detalle: `${adultos} × ${veces(dias, "día", "días")} · más de ${EDAD_MAXIMA_MENOR} años`,
        importe: adultos * dias * tarifas.adulto,
      })
    }
    if (menores > 0) {
      lineas.push({
        concepto: "Ingreso menores",
        detalle: `${menores} × ${veces(dias, "día", "días")} · de ${EDAD_MINIMA_CON_CARGO} a ${EDAD_MAXIMA_MENOR} años`,
        importe: menores * dias * tarifas.menor,
      })
    }
    if (sinCargo > 0) {
      lineas.push({
        concepto: "Sin cargo",
        detalle: `Menores de ${EDAD_MINIMA_CON_CARGO} años o certificado CUD`,
        importe: 0,
      })
    }
  }

  const delDia = solicitud.lugares.filter((lugar) => lugar.tipo !== "bungalow")
  if (delDia.length > 0) {
    lineas.push({
      concepto: delDia.map((lugar) => capitalizar(lugar.nombre)).join(", "),
      detalle: "El lugar no suma: está incluido en la entrada.",
      importe: 0,
    })
  }

  if (solicitud.mesas.length > 0) {
    lineas.push({
      concepto: "Mesas de restaurante y bar",
      detalle: "La reserva de la mesa no suma. Se consume en el lugar.",
      importe: 0,
    })
  }

  const total = lineas.reduce((suma, linea) => suma + linea.importe, 0)
  return { total, totalEfectivo: conDescuentoEfectivo(total), lineas }
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function unidadesDeSolicitud(solicitud: SolicitudGuardada) {
  return [...solicitud.lugares.map((lugar) => lugar.id), ...solicitud.mesas.map((mesa) => mesa.id)]
}

export function crearCodigo() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let codigo = ""
  for (const byte of bytes) codigo += alfabeto[byte % alfabeto.length]
  return `LC-${codigo}`
}

export function pasosDe(tipo: Borrador["tipo"]) {
  if (!tipo) return [{ id: "grupo", label: "Grupo" }]
  if (tipo === "estudiantil") {
    return [
      { id: "grupo", label: "Grupo" },
      { id: "institucion", label: "Institución" },
      { id: "tiempo", label: "Fecha" },
      { id: "confirmar", label: "Confirmar" },
    ]
  }
  return [
    { id: "grupo", label: "Grupo" },
    { id: "personas", label: "Personas" },
    { id: "tiempo", label: "Fecha" },
    { id: "lugar", label: "Lugar" },
    { id: "mesa", label: "Mesa" },
    { id: "confirmar", label: "Confirmar" },
  ]
}

export function primerError(errores: Errores) {
  const clave = Object.keys(errores)[0]
  return clave ?? null
}
