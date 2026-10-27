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

# Migraciones al arrancar sin el CLI de Prisma: el script va empaquetado con su driver
# (mariadb) y lee las migraciones de prisma/migrations.
rm -rf "$destino/prisma"
mkdir -p "$destino/prisma"
cp -r prisma/migrations "$destino/prisma/"
npx esbuild scripts/migrate.mjs --bundle --platform=node --target=node24 --format=cjs --log-level=warning --outfile="$destino/migrate.cjs"

cp scripts/arrancar.sh "$destino/arrancar.sh"

# Que el build falle acá y no el arranque si el binario de ffmpeg no quedó adentro.
test -x "$destino/node_modules/ffmpeg-static/ffmpeg"
