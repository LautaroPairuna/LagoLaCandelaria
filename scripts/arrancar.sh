#!/bin/sh
# Arranque en producción (Next standalone + Railpack). Corre desde .next/standalone, que
# es lo único que lleva la imagen: aplica las migraciones pendientes y después levanta
# el sitio.
# Si las migraciones fallan, el sitio arranca igual y el error queda en el log, para que
# se pueda entrar a la base y resolverlo (si no arranca, Dokploy no deja abrir la consola).
cd "$(dirname "$0")" || exit 1

node migrate.cjs ||
  echo "ATENCION: las migraciones no se aplicaron. El sitio arranca igual; revisá el error de arriba y _prisma_migrations."

exec node --max-old-space-size=384 server.js
