// Los números argentinos tienen 10 dígitos entre característica y número (11 + 8 en
// AMBA). El visitante carga solo esos; el +54 lo pone el sistema. Se aceptan también
// con el 0 de larga distancia, con el 9 de celular o con el +54 ya escrito.
export function normalizarTelefono(entrada: string) {
  let digitos = entrada.replace(/\D/g, "")
  if (digitos.startsWith("54") && digitos.length >= 12) digitos = digitos.slice(2)
  if (digitos.startsWith("9") && digitos.length === 11) digitos = digitos.slice(1)
  if (digitos.startsWith("0")) digitos = digitos.slice(1)
  if (!/^[1-9]\d{9}$/.test(digitos)) return null
  return { nacional: digitos, e164: `+54${digitos}`, whatsapp: `549${digitos}` }
}

export function limpiarDni(entrada: string) {
  return entrada.replace(/\D/g, "")
}

export function dniValido(dni: string) {
  return /^\d{7,8}$/.test(dni)
}
