function conEsquema(valor: string) {
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`
}

export const urlSitio = conEsquema(process.env.SITE_URL ?? "http://localhost:4721").replace(/\/+$/, "")
