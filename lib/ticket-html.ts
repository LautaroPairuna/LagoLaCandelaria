import { textoDelEfectivo, textoDelTotal } from "@/lib/predio/cotizacion"
import { pesos } from "@/lib/predio/tarifas"
import type { TicketDatos } from "@/lib/reservas"
import { filasDelTicket, titularDelTicket } from "@/lib/ticket"

function escapar(valor: string) {
  return valor.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

function fila(termino: string, detalle: string) {
  return `<div class="fila"><dt>${escapar(termino)}</dt><dd>${escapar(detalle)}</dd></div>`
}

export function htmlDelTicket(ticket: TicketDatos, qrDataUrl: string, enlace: string) {
  const personas = ticket.personas.length > 1
    ? `<h2>Quién ingresa</h2><ul>${ticket.personas
        .map(
          (persona) =>
            `<li><strong>${escapar(`${persona.nombre} ${persona.apellido}`)}</strong>${persona.dni ? ` · DNI ${escapar(persona.dni)}` : ""} · ${persona.edad} años${persona.notas ? `<br>${escapar(persona.notas)}` : ""}</li>`,
        )
        .join("")}</ul>`
    : ""
  const lineas = ticket.cotizacion.lineas
    .map((linea) => `<div class="fila"><dt>${escapar(linea.concepto)}<small>${escapar(linea.detalle)}</small></dt><dd>${ticket.cotizacion.consumo ? "" : escapar(pesos(linea.importe))}</dd></div>`)
    .join("")
  const efectivo = textoDelEfectivo(ticket.cotizacion)

  return `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Reserva ${escapar(ticket.codigo)} · Lago La Candelaria</title>
<style>
  body { margin: 0; background: #fbf5ea; color: #3a3530; font-family: Georgia, sans-serif; }
  main { max-width: 760px; margin: 24px auto; background: white; padding: 32px; }
  h1 { font-size: 42px; margin: 8px 0; }
  h2 { font-size: 22px; margin: 28px 0 8px; }
  .codigo { letter-spacing: .14em; font-size: 13px; text-transform: uppercase; color: #1c71a1; }
  .qr { display: flex; gap: 20px; align-items: center; }
  img { width: 180px; height: 180px; }
  .fila { display: grid; grid-template-columns: 1fr auto; gap: 12px; border-top: 1px solid #eadfce; padding: 10px 0; }
  dt small { display: block; color: #6b635b; font-weight: 400; }
  ul { padding-left: 18px; }
  li { margin: 8px 0; }
</style>
<main>
  <p class="codigo">Lago La Candelaria · Reserva N.º ${ticket.numero}</p>
  <h1>${escapar(ticket.codigo)}</h1>
  <div class="qr">
    <img src="${qrDataUrl}" alt="Código QR de la reserva ${escapar(ticket.codigo)}">
    <p>Mostrá este QR en el ingreso.<br>${escapar(enlace)}</p>
  </div>
  <h2>La visita</h2>
  ${filasDelTicket(ticket).map(([termino, detalle]) => fila(termino, detalle)).join("")}
  ${personas}
  <h2>Total</h2>
  ${lineas}
  <div class="fila"><dt>Total</dt><dd><strong>${escapar(textoDelTotal(ticket.cotizacion))}</strong></dd></div>
  ${efectivo ? `<p>${escapar(efectivo)}</p>` : ""}
  <h2>Quién hizo la reserva</h2>
  ${ticket.institucion ? fila("Institución", ticket.institucion) : ""}
  ${fila("Responsable", titularDelTicket(ticket))}
  ${ticket.contacto.telefono ? fila("Teléfono", ticket.contacto.telefono) : ""}
  ${ticket.contacto.email ? fila("Correo", ticket.contacto.email) : ""}
</main>
</html>`
}
