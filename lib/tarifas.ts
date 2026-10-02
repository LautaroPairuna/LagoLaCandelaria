/**
 * Tarifas de referencia para armar el total de la solicitud.
 * El predio no publica una lista vigente: estos importes se editan acá
 * y el ticket guarda el número con el que se confirmó la solicitud.
 */
export const tarifas = {
  adulto: 18_000,
  menor: 10_000,
  lugar: {
    parrilla: 15_000,
    gazebo: 12_000,
    quincho: 28_000,
    palapa: 8_000,
    bungalow: 90_000,
  },
} as const

export function pesos(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor)
}
