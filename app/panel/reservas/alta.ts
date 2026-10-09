"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, ErrorHumano, exigir, type Resultado } from "@/lib/errores"
import { anotar, registrarActividad } from "@/lib/panel/actividad"
import { cobroPropuesto } from "@/lib/panel/libro-caja"
import { puedeVer } from "@/lib/panel/roles"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { cotizarDia } from "@/lib/predio/cotizacion"
import { aFechaDb, esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { inventario } from "@/lib/predio/inventario"
import { nombreDeUnidad } from "@/lib/predio/nombres"
import { pesos } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"
import { nombre, telefono } from "@/lib/reserva-familia"
import { crearReserva, libreEn } from "@/lib/reservas"

const cantidad = (maximo: number) => z.number("Escribí cuántos son.").int("Escribí cuántos son.").min(0, "Revisá la cantidad.").max(maximo, `Para más de ${maximo}, cargalo como grupo.`)
const lugaresPermitidos = ["PARRILLA", "QUINCHO", "GAZEBO", "PALAPA"] as const

const pedidoDeAlta = z
  .object({
    fecha: z.string(),
    nombre,
    apellido: nombre,
    dni: z
      .string()
      .trim()
      .regex(/^\d{7,8}$|^$/, "El DNI va con 7 u 8 números, sin puntos.")
      .optional(),
    telefono: z.string().trim().optional(),
    adultos: cantidad(200),
    menores: cantidad(200),
    sinCargo: cantidad(200),
    unidadId: z.string().max(24).optional(),
    notas: z.string().trim().max(500, "Es muy largo: resumilo en 500 letras.").optional(),
    cobro: z.enum(["EFECTIVO", "DEBITO", "TRANSFERENCIA"]).optional(),
    ingresan: z.boolean().optional(),
  })
  .refine((datos) => datos.adultos >= 1, { path: ["adultos"], message: "Tiene que venir al menos un adulto." })

/// Una reserva cargada desde el panel: alguien que llegó sin avisar (en Puerta, con
/// cobro e ingreso en el mismo paso) o que reservó por teléfono (en Reservas).
export async function reservarEnElPredio(pedido: z.input<typeof pedidoDeAlta>): Promise<Resultado<{ id: number }>> {
  return accion("reservarEnElPredio", async () => {
    const sesion = await permisoParaAccion("puerta", "reservas")
    const datos = pedidoDeAlta.parse(pedido)
    const hoy = hoyEnElPredio()
    exigir(esFechaIso(datos.fecha) && datos.fecha >= hoy && datos.fecha <= sumarDiasIso(hoy, 365), "Elegí un día de hoy en adelante, dentro del próximo año.")
    const cobra = Boolean(datos.cobro)
    const ingresan = Boolean(datos.ingresan)
    exigir(!cobra || puedeVer(sesion.user.role, "puerta") || puedeVer(sesion.user.role, "caja"), "Tu usuario no puede cobrar: cargá la reserva sin cobro y la cobran en Puerta.")
    exigir(!ingresan || (puedeVer(sesion.user.role, "puerta") && datos.fecha === hoy), "El ingreso se marca en Puerta, el día que llegan.")

    let tel: string | null = null
    if (datos.telefono) {
      const leido = telefono.safeParse(datos.telefono)
      if (!leido.success) throw new ErrorHumano("El teléfono va con característica y número, 10 dígitos en total (por ejemplo 11 3009 1020).")
      tel = leido.data
    }
    const unidad = datos.unidadId ? inventario.find((item) => item.id === datos.unidadId) : undefined
    exigir(!datos.unidadId || (unidad && (lugaresPermitidos as readonly string[]).includes(unidad.tipo)), "Ese lugar no se puede elegir acá. Elegí otro o dejalo sin lugar.")

    const grupo = { adultos: datos.adultos, menores: datos.menores, sinCargo: datos.sinCargo }
    const cotizacion = cotizarDia(grupo)
    const quien = sesion.user.name.slice(0, 80)
    const creada = await crearReserva({
      modulo: "FINDE_FAMILIA",
      origen: "PREDIO",
      estado: "CONFIRMADA",
      desde: datos.fecha,
      hasta: datos.fecha,
      ingreso: "10:00",
      salida: "19:00",
      cliente: { nombre: datos.nombre, apellido: datos.apellido, dni: datos.dni || null, email: null, telefono: tel },
      grupo,
      cotizacion,
      propuesta: unidad ? (unidad.tipo === "PARRILLA" || unidad.tipo === "QUINCHO" ? "Parrilla" : "Gazebo o palapa") : null,
      notas: [datos.fecha === hoy ? `Llegó sin reserva. La cargó ${quien}.` : `Reserva tomada por ${quien}.`, datos.notas].filter(Boolean).join(" "),
      asignar: unidad ? (ocupacion) => (libreEn(ocupacion, datos.fecha, datos.fecha)(unidad.id) ? [unidad.id] : null) : undefined,
    })
    if ("sinLugar" in creada) throw new ErrorHumano(`La ${nombreDeUnidad[unidad!.tipo].toLowerCase()} ${unidad!.etiqueta} ya está tomada ese día. Elegí otro lugar.`)

    if (cobra || ingresan) {
      await db().$transaction(async (tx) => {
        if (datos.cobro) {
          const propuesto = cobroPropuesto(cotizacion.total, [], datos.cobro)
          if (propuesto.importe > 0) {
            await tx.pago.create({
              data: { reservaId: creada.id, fecha: aFechaDb(hoy), forma: datos.cobro, ...propuesto, detalle: "Saldo", registradoPor: quien },
            })
            await registrarActividad(tx, {
              usuario: quien,
              userId: sesion.user.id,
              seccion: "caja",
              accion: "cobro",
              detalle: `Cobró ${pesos(propuesto.importe)} en ${datos.cobro === "DEBITO" ? "débito" : datos.cobro.toLowerCase()} a la reserva ${creada.id} (${creada.codigo}), cargada en el predio`,
              reservaId: creada.id,
              monto: propuesto.importe,
            })
          }
        }
        if (ingresan) await tx.reserva.update({ where: { id: creada.id }, data: { ingresoEn: new Date(), ingresoPor: quien } })
      })
    }

    for (const ruta of ["/panel/puerta", "/panel/reservas", "/panel/ocupacion", "/panel/lugares", "/panel/caja"]) revalidatePath(ruta, "layout")
    await anotar(sesion, {
      seccion: datos.fecha === hoy ? "puerta" : "reservas",
      accion: "reserva cargada",
      detalle: `Cargó la reserva ${creada.id} (${creada.codigo}) de ${datos.nombre} ${datos.apellido} para el ${datos.fecha.split("-").reverse().join("/")}, ${grupo.adultos + grupo.menores + grupo.sinCargo} personas${datos.fecha === hoy ? ", llegó sin reserva" : ""}${ingresan ? ", ya ingresaron" : ""}`,
      reservaId: creada.id,
    })
    return { ok: true, id: creada.id }
  })
}
