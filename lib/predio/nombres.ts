import type { Modulo, TipoUnidad } from "@/generated/prisma/enums"

export const lineas = [
  { id: "familia", nombre: "Finde en familia", modulos: ["FINDE_FAMILIA", "BUNGALOW", "RESTAURANTE"] },
  { id: "estudiantil", nombre: "Estudiantil", modulos: ["CAMPAMENTO", "SALIDA_EDUCATIVA", "VIAJE_EGRESADOS"] },
  { id: "aventura", nombre: "Aventura", modulos: ["ACTIVIDAD_AVENTURA"] },
] as const satisfies readonly { id: string; nombre: string; modulos: readonly Modulo[] }[]

export type LineaId = (typeof lineas)[number]["id"]

export const nombreDelModulo: Record<Modulo, string> = {
  FINDE_FAMILIA: "Finde en familia",
  BUNGALOW: "Bungalow",
  RESTAURANTE: "Restaurante",
  CAMPAMENTO: "Campamento",
  SALIDA_EDUCATIVA: "Salida educativa",
  VIAJE_EGRESADOS: "Viaje de egresados",
  ACTIVIDAD_AVENTURA: "Aventura",
}

export const nombreDeUnidad: Record<TipoUnidad, string> = {
  PARRILLA: "Parrilla",
  QUINCHO: "Quincho",
  GAZEBO: "Gazebo",
  PALAPA: "Palapa",
  BUNGALOW: "Bungalow",
  MESA_RESTAURANTE: "Mesa restaurante",
  MESA_BAR: "Mesa bar",
}
