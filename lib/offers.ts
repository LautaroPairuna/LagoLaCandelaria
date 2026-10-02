export const zoneIds = [
  "lago",
  "playa",
  "parque",
  "canchas",
  "parrillas",
  "palapas",
  "mesa",
  "bungalows",
  "carpas",
  "dormis",
] as const

export type ZoneId = (typeof zoneIds)[number]
