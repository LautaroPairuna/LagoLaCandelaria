import { z } from "zod"

// Zod prueba si puede compilar validadores con Function(): la Content Security Policy no
// permite eval, así que en el navegador se lo indica de entrada y no queda un bloqueo
// registrado en cada página. Valida igual, sin compilar.
z.config({ jitless: true })
