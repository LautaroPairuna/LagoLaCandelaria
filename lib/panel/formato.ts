const diaCorto = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", timeZone: "UTC" })
const diaLargo = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
const mesLargo = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })

function utc(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`)
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function fechaCortaPanel(iso: string) {
  return capitalizar(diaCorto.format(utc(iso)).replace(".", ""))
}

export function fechaLargaPanel(iso: string) {
  return capitalizar(diaLargo.format(utc(iso)).replace(",", ""))
}

export function rangoPanel(desde: string, hasta: string) {
  return desde === hasta ? fechaCortaPanel(desde) : `${fechaCortaPanel(desde)} – ${fechaCortaPanel(hasta)}`
}

export function nombreDelMes(mes: string) {
  return capitalizar(mesLargo.format(utc(`${mes}-01`)))
}
