import { pesos } from "@/lib/predio/tarifas"
import { fechaLarga, textoDelEfectivo, textoDelTotal, type SolicitudGuardada } from "@/lib/solicitud"

function escapar(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function fila(termino: string, detalle: string) {
  return `<div class="fila"><dt>${escapar(termino)}</dt><dd>${escapar(detalle)}</dd></div>`
}

export function htmlDelTicket(solicitud: SolicitudGuardada, qrDataUrl: string, enlace: string) {
  const personas =
    solicitud.tipo === "familiar"
      ? solicitud.familias
          .map((familia, indice) => {
            const gente = [familia.responsable, ...familia.integrantes]
            const items = gente
              .map((persona) => {
                const extra = [
                  persona.cud ? "Certificado CUD, no abona ingreso." : "",
                  persona.notas ? `Importante: ${persona.notas}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")
                return `<li><strong>${escapar(persona.nombre)} ${escapar(persona.apellido)}</strong> · DNI ${escapar(persona.dni)} · ${persona.edad} años${persona.rol.startsWith("Responsable") ? " · Responsable" : ""}${extra ? `<br>${escapar(extra)}` : ""}</li>`
              })
              .join("")
            return `<h3>Familia ${indice + 1}</h3><ul>${items}</ul>`
          })
          .join("")
      : ""

  const institucion = solicitud.institucion
    ? [
        fila("Institución", solicitud.institucion.nombre),
        fila("Responsable", `${solicitud.institucion.responsable.nombre} ${solicitud.institucion.responsable.apellido}`),
        fila("DNI", solicitud.institucion.responsable.dni),
        fila("Cargo", solicitud.institucion.cargo),
        fila("Estudiantes", String(solicitud.institucion.estudiantes)),
        fila("Adultos", String(solicitud.institucion.adultos)),
        fila("Edades", solicitud.institucion.edades),
        solicitud.institucion.notas ? fila("Importante", solicitud.institucion.notas) : "",
      ].join("")
    : ""

  const lugares = solicitud.lugares.length
    ? solicitud.lugares
        .map(
          (lugar) =>
            `${lugar.nombre.charAt(0).toUpperCase()}${lugar.nombre.slice(1)} (${lugar.capacidad} personas)`,
        )
        .join(", ")
    : "Sin lugar específico"
  const mesas = solicitud.mesas.length
    ? solicitud.mesas.map((mesa) => `${mesa.zona === "restaurante" ? "Restaurante" : "Bar"} ${mesa.nombre}`).join(", ")
    : "Sin mesa"

  const lineas = solicitud.cotizacion.lineas
    .map(
      (linea) =>
        `<div class="fila"><dt>${escapar(linea.concepto)}<small>${escapar(linea.detalle)}</small></dt><dd>${escapar(pesos(linea.importe))}</dd></div>`,
    )
    .join("")

  return `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Solicitud ${escapar(solicitud.codigo)} · Lago La Candelaria</title>
<style>
  body { margin: 0; background: #fbf5ea; color: #3a3530; font-family: Georgia, sans-serif; }
  main { max-width: 760px; margin: 24px auto; background: white; padding: 32px; }
  h1 { font-size: 42px; margin: 8px 0; }
  h2 { font-size: 22px; margin: 28px 0 8px; }
  h3 { margin: 16px 0 6px; }
  .codigo { letter-spacing: .14em; font-size: 13px; text-transform: uppercase; color: #1c71a1; }
  .qr { display: flex; gap: 20px; align-items: center; }
  img { width: 180px; height: 180px; }
  .fila { display: grid; grid-template-columns: 1fr auto; gap: 12px; border-top: 1px solid #eadfce; padding: 10px 0; }
  dt small { display: block; color: #6b635b; font-weight: 400; }
  ul { padding-left: 18px; }
  li { margin: 8px 0; }
</style>
<main>
  <p class="codigo">Lago La Candelaria · Solicitud de reserva</p>
  <h1>${escapar(solicitud.codigo)}</h1>
  <div class="qr">
    <img src="${qrDataUrl}" alt="Código QR de la solicitud ${escapar(solicitud.codigo)}">
    <p>Mostrá este QR en el ingreso. El predio lo escanea y abre la solicitud.<br>${escapar(enlace)}</p>
  </div>
  <h2>La visita</h2>
  ${fila("Grupo", solicitud.tipo === "familiar" ? "Familiar" : "Estudiantil")}
  ${fila("Estadía", solicitud.estadia === "dia" ? "Pasar el día" : `${solicitud.noches} ${solicitud.noches === 1 ? "noche" : "noches"}`)}
  ${fila("Llegada", `${fechaLarga(solicitud.desde)} · ${solicitud.ingreso}`)}
  ${fila("Salida", `${fechaLarga(solicitud.hasta)} · ${solicitud.salida}`)}
  ${fila("Personas", String(solicitud.personas))}
  ${institucion}
  <h2>Quién ingresa</h2>
  ${personas || "<p>El listado individual de un grupo estudiantil lo completa el predio con la institución.</p>"}
  <h2>Dónde</h2>
  ${fila("Lugares", lugares)}
  ${fila("Mesas", mesas)}
  <h2>Total de la solicitud</h2>
  ${lineas}
  <div class="fila"><dt>Total</dt><dd><strong>${escapar(textoDelTotal(solicitud.cotizacion))}</strong></dd></div>
  ${textoDelEfectivo(solicitud.cotizacion) ? `<p>${escapar(textoDelEfectivo(solicitud.cotizacion) ?? "")}</p>` : ""}
  <h2>Contacto</h2>
  ${fila("Nombre", `${solicitud.contacto.nombre} ${solicitud.contacto.apellido}`)}
  ${fila("Correo", solicitud.contacto.email)}
  ${fila("Teléfono", solicitud.contacto.telefono)}
</main>
</html>`
}
