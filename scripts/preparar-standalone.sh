#!/bin/sh
# Paso final del build en Railpack (después de "next build"): deja en .next/standalone
# todo lo que lleva la imagen, que es solo esa carpeta.
set -e
destino=.next/standalone

# Standalone no incluye los estáticos ni public/.
cp -r .next/static "$destino/.next/static"
cp -r public "$destino/public"

# Next copia el .env al standalone: en producción las variables las pone Dokploy y no
# tienen que quedar guardadas dentro de la imagen.
rm -f "$destino"/.env*

# Migraciones al arrancar: el CLI de Prisma (y dotenv, que importa la config) en la misma
# versión del lockfile, aparte de la app, con el esquema, las migraciones y la config.
mkdir -p "$destino/migraciones"
cp -r prisma prisma7.config.ts "$destino/migraciones/"
echo '{"private":true}' > "$destino/migraciones/package.json"
version() { node -p "require('./node_modules/$1/package.json').version"; }
npm install --prefix "$destino/migraciones" --omit=dev --no-audit --no-fund --no-save "prisma@$(version prisma)" "dotenv@$(version dotenv)"

cp scripts/arrancar.sh "$destino/arrancar.sh"
