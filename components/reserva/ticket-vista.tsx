import { LogoMark } from "@/components/logo-mark"
import { pesos } from "@/lib/predio/tarifas"
import { fechaLarga, textoDelEfectivo, textoDelTotal, type SolicitudGuardada } from "@/lib/solicitud"
import { phones } from "@/lib/site"

function Fila({ termino, detalle }: { termino: string; detalle: string }) {
  return (
    <div className="grid gap-1 border-t border-ink/10 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold tracking-[0.14em] text-ink/50 uppercase">{termino}</dt>
      <dd className="text-ink">{detalle}</dd>
    </div>
  )
}

export function TicketVista({
  solicitud,
  qrDataUrl,
  enlace,
}: {
  solicitud: SolicitudGuardada
  qrDataUrl?: string
  enlace?: string
}) {
  const notas = solicitud.familias.flatMap((familia) =>
    [familia.responsable, ...familia.integrantes].filter((persona) => persona.notas || persona.cud),
  )

  return (
    <article className="ticket-sheet overflow-hidden rounded-[1.8rem] border border-ink/10 bg-white text-ink shadow-[0_18px_50px_rgba(58,53,48,0.08)]">
      <div className="flex items-center justify-between gap-4 bg-cream px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-14" />
          <div>
            <p className="kicker">Solicitud de reserva</p>
            <p className="font-display text-lg tracking-tight">Lago La Candelaria</p>
          </div>
        </div>
        <p className="font-display text-2xl tracking-tight text-lake-ink md:text-3xl">{solicitud.codigo}</p>
      </div>

      <div className="grid gap-6 px-5 py-6 md:grid-cols-[180px_1fr] md:px-8">
        <div className="grid place-items-center rounded-2xl bg-cream p-3">
          {qrDataUrl ? (
            // El QR se genera en el momento, no es una imagen del sitio.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`Código QR de la solicitud ${solicitud.codigo}`} className="size-40" />
          ) : (
            <p className="px-3 text-center text-sm text-ink/60">Generando el código QR…</p>
          )}
        </div>
        <div>
          <h2 className="font-display text-4xl tracking-tight">Mostrá este ticket en el ingreso.</h2>
          <p className="mt-2 leading-relaxed text-ink/75">
            El predio escanea el QR y ve esta misma solicitud: quién viene, qué se reservó y el total.
            {enlace ? ` ${enlace}` : ""}
          </p>
        </div>
      </div>

      <div className="px-5 pb-8 md:px-8">
        <h3 className="font-display text-2xl tracking-tight">La visita</h3>
        <dl>
          <Fila termino="Grupo" detalle={solicitud.tipo === "familiar" ? "Familiar" : "Estudiantil"} />
          <Fila
            termino="Estadía"
            detalle={
              solicitud.estadia === "dia"
                ? "Pasar el día"
                : `${solicitud.noches} ${solicitud.noches === 1 ? "noche" : "noches"}`
            }
          />
          <Fila termino="Llegada" detalle={`${fechaLarga(solicitud.desde)} · ${solicitud.ingreso} hs`} />
          <Fila termino="Salida" detalle={`${fechaLarga(solicitud.hasta)} · ${solicitud.salida} hs`} />
          <Fila termino="Personas" detalle={String(solicitud.personas)} />
        </dl>

        {solicitud.institucion ? (
          <>
            <h3 className="font-display mt-8 text-2xl tracking-tight">La institución</h3>
            <dl>
              <Fila termino="Institución" detalle={solicitud.institucion.nombre} />
              <Fila
                termino="Responsable"
                detalle={`${solicitud.institucion.responsable.nombre} ${solicitud.institucion.responsable.apellido} · DNI ${solicitud.institucion.responsable.dni}`}
              />
              <Fila termino="Cargo" detalle={solicitud.institucion.cargo} />
              <Fila termino="Estudiantes" detalle={String(solicitud.institucion.estudiantes)} />
              <Fila termino="Adultos" detalle={String(solicitud.institucion.adultos)} />
              <Fila termino="Edades" detalle={solicitud.institucion.edades} />
              {solicitud.institucion.cud > 0 ? (
                <Fila termino="CUD" detalle={`${solicitud.institucion.cud} no abonan el ingreso`} />
              ) : null}
              {solicitud.institucion.notas ? <Fila termino="Importante" detalle={solicitud.institucion.notas} /> : null}
            </dl>
          </>
        ) : null}

        {solicitud.familias.length > 0 ? (
          <>
            <h3 className="font-display mt-8 text-2xl tracking-tight">Quién ingresa</h3>
            <div className="mt-3 space-y-5">
              {solicitud.familias.map((familia, indice) => (
                <section key={`${familia.responsable.dni}-${indice}`}>
                  <p className="kicker">Familia {indice + 1}</p>
                  <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
                    {[familia.responsable, ...familia.integrantes].map((persona) => (
                      <li key={persona.dni} className="py-3">
                        <p className="font-semibold">
                          {persona.nombre} {persona.apellido}
                          {persona.rol.startsWith("Responsable") ? " · Responsable" : ""}
                        </p>
                        <p className="text-sm text-ink/70">
                          DNI {persona.dni} · {persona.edad} años
                          {persona.cud ? " · Certificado CUD, no abona el ingreso" : ""}
                        </p>
                        {persona.notas ? (
                          <p className="mt-1 text-sm font-semibold text-earth-ink">Importante: {persona.notas}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        ) : null}

        {notas.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-earth-soft px-4 py-4">
            <p className="kicker">Para el personal del predio</p>
            <ul className="mt-2 space-y-1 text-sm">
              {notas.map((persona) => (
                <li key={persona.dni}>
                  {persona.nombre} {persona.apellido}: {persona.notas || "certificado CUD"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h3 className="font-display mt-8 text-2xl tracking-tight">Dónde van a estar</h3>
        <dl>
          <Fila
            termino="Lugares"
            detalle={
              solicitud.lugares.length
                ? solicitud.lugares.map((lugar) => `${capitalizar(lugar.nombre)} · ${lugar.capacidad} personas`).join(" · ")
                : "El predio asigna el cupo de este grupo"
            }
          />
          <Fila
            termino="Mesas"
            detalle={
              solicitud.mesas.length
                ? solicitud.mesas
                    .map((mesa) => `${mesa.zona === "restaurante" ? "Restaurante" : "Bar"} ${mesa.nombre}`)
                    .join(" · ")
                : "Sin mesa reservada"
            }
          />
        </dl>

        <h3 className="font-display mt-8 text-2xl tracking-tight">Total de la solicitud</h3>
        <dl>
          {solicitud.cotizacion.lineas.map((linea) => (
            <Fila key={`${linea.concepto}-${linea.detalle}`} termino={linea.concepto} detalle={`${linea.detalle} · ${pesos(linea.importe)}`} />
          ))}
        </dl>
        <p className="font-display mt-4 text-4xl tracking-tight">{textoDelTotal(solicitud.cotizacion)}</p>
        {textoDelEfectivo(solicitud.cotizacion) ? (
          <p className="mt-1 font-semibold">{textoDelEfectivo(solicitud.cotizacion)}</p>
        ) : null}
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
          No se cobra en esta pantalla. El predio confirma el importe y la forma de pago al aceptar la solicitud.
        </p>

        <h3 className="font-display mt-8 text-2xl tracking-tight">Quién hizo la reserva</h3>
        <dl>
          <Fila termino="Nombre" detalle={`${solicitud.contacto.nombre} ${solicitud.contacto.apellido}`} />
          <Fila termino="Correo" detalle={solicitud.contacto.email} />
          <Fila termino="Teléfono" detalle={solicitud.contacto.telefono} />
        </dl>

        <p className="mt-8 text-sm text-ink/60">
          Si hay que cambiar algo, llamá al {phones.map((phone) => phone.label).join(" o al ")}.
        </p>
      </div>
    </article>
  )
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
