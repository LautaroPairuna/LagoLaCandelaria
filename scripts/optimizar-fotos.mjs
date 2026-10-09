import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ORIGEN = "fotos"
const DESTINO = "public/img"
const MANIFIESTO = "lib/fotos.generadas.json"
const ANCHOS = [480, 768, 1024, 1600, 1920]
const ANCHO_RESPALDO = 1024
const CALIDAD = { avif: { quality: 55, effort: 5 }, webp: { quality: 74 }, jpeg: { quality: 78, mozjpeg: true }, png: {} }

async function archivosDe(carpeta) {
  const entradas = await readdir(carpeta, { withFileTypes: true })
  const anidados = await Promise.all(
    entradas.map((entrada) => {
      const ruta = path.join(carpeta, entrada.name)
      return entrada.isDirectory() ? archivosDe(ruta) : [ruta]
    }),
  )
  return anidados.flat().filter((ruta) => /\.(jpe?g|png)$/i.test(ruta))
}

async function vigente(salida, mtimeOrigen) {
  try {
    return (await stat(salida)).mtimeMs >= mtimeOrigen
  } catch {
    return false
  }
}

async function procesar(archivo) {
  const relativa = path.relative(ORIGEN, archivo).split(path.sep).join("/")
  const sinExtension = relativa.replace(/\.[^.]+$/, "")
  const { mtimeMs } = await stat(archivo)
  const meta = await sharp(archivo).metadata()
  const girada = (meta.orientation ?? 1) >= 5
  const width = girada ? meta.height : meta.width
  const height = girada ? meta.width : meta.height
  const hasAlpha = meta.hasAlpha

  const anchos = [...new Set([...ANCHOS.filter((ancho) => ancho < width), width])]
  const formatoRespaldo = hasAlpha ? "png" : "jpeg"
  const extensionRespaldo = hasAlpha ? "png" : "jpg"
  const anchoRespaldo = anchos.filter((ancho) => ancho <= ANCHO_RESPALDO).at(-1) ?? anchos[0]

  const tareas = [
    ...anchos.flatMap((ancho) => ["avif", "webp"].map((formato) => ({ ancho, formato, extension: formato }))),
    { ancho: anchoRespaldo, formato: formatoRespaldo, extension: extensionRespaldo },
  ]

  await mkdir(path.dirname(path.join(DESTINO, relativa)), { recursive: true })
  let generadas = 0
  for (const { ancho, formato, extension } of tareas) {
    const salida = path.join(DESTINO, `${sinExtension}-${ancho}.${extension}`)
    if (await vigente(salida, mtimeMs)) continue
    await sharp(archivo).rotate().resize({ width: ancho }).toFormat(formato, CALIDAD[formato]).toFile(salida)
    generadas += 1
  }

  return {
    clave: `/${relativa}`,
    foto: {
      ancho: width,
      alto: height,
      anchos,
      base: `/img/${sinExtension}`,
      respaldo: `/img/${sinExtension}-${anchoRespaldo}.${extensionRespaldo}`,
    },
    generadas,
  }
}

const resultados = await Promise.all((await archivosDe(ORIGEN)).map(procesar))
resultados.sort((a, b) => a.clave.localeCompare(b.clave))

const manifiesto = `${JSON.stringify(Object.fromEntries(resultados.map(({ clave, foto }) => [clave, foto])), null, 2)}\n`
const anterior = await readFile(MANIFIESTO, "utf8").catch(() => "")
if (anterior !== manifiesto) await writeFile(MANIFIESTO, manifiesto)

const generadas = resultados.reduce((suma, { generadas }) => suma + generadas, 0)
console.log(`Fotos: ${resultados.length} originales, ${generadas} variantes nuevas.`)
