import { CAPACIDAD_DE_PLAYA } from "@/lib/predio/inventario"

// Cada gazebo o palapa es para hasta 4 personas: de 5 a 8 van 2, de 9 a 12 van 3, y así.
export function lugaresDePlayaPara(personas: number) {
  return Math.max(1, Math.ceil(personas / CAPACIDAD_DE_PLAYA))
}
