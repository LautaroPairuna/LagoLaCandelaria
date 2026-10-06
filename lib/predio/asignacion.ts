// Según la especificación, en la playa el grupo ocupa 1, 2 o 3 lugares según su tamaño.
export function lugaresDePlayaPara(personas: number) {
  if (personas < 4) return 1
  if (personas <= 8) return 2
  return 3
}
