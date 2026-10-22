import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, rm, rmdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

// Las variantes (public/img) y el manifiesto se commitean: así el build de cada deploy no
// vuelve a generarlas. Una foto se procesa solo si su original cambió (se compara la
// huella del archivo, no la fecha, que en un clon nuevo no dice nada) o si le falta
// alguna variante. Las variantes de fotos que ya no están en fotos/ se borran.

const ORIGEN = "fotos"
const DESTINO = "public/img"
const MANIFIESTO = "lib/fotos.generadas.json"
const ANCHOS = [480, 768, 1024, 1600, 1920]
const ANCHO_RESPALDO = 1024
const CALIDAD = { avif: { quality: 55, effort: 5 }, webp: { quality: 74 }, jpeg: { quality: 78, mozjpeg: true }, png: {} }

async function archivosDe(carpeta) {
  const entradas = await readdir(carpeta, { withFileTypes: true }).catch(() => [])
  const anidados = await Promise.all(
    entradas.map((entrada) => {
      const ruta = path.join(carpeta, entrada.name)
      return entrada.isDirectory() ? archivosDe(ruta) : [ruta]
    }),
  )
  return anidados.flat()
}

async function existe(ruta) {
  return stat(ruta).then(
    () => true,
    () => false,
  )
}

const anterior = JSON.parse(await readFile(MANIFIESTO, "utf8").catch(() => "{}"))

async function procesar(archivo) {
  const relativa = path.relative(ORIGEN, archivo).split(path.sep).join("/")
  const clave = `/${relativa}`
  const sinExtension = relativa.replace(/\.[^.]+$/, "")
  const original = await readFile(archivo)
  const huella = createHash("sha256").update(original).digest("hex").slice(0, 16)

  const previa = anterior[clave]
  const salidas = (foto) => [
    ...foto.anchos.flatMap((ancho) => ["avif", "webp"].map((formato) => path.join(DESTINO, `${sinExtension}-${ancho}.${formato}`))),
    path.join("public", foto.respaldo),
  ]
  if (previa?.huella === huella && (await Promise.all(salidas(previa).map(existe))).every(Boolean)) {
    return { clave, foto: previa, archivos: salidas(previa), generadas: 0 }
  }

  const meta = await sharp(original).metadata()
  const girada = (meta.orientation ?? 1) >= 5
  const width = girada ? meta.height : meta.width
  const height = girada ? meta.width : meta.height
  const extensionRespaldo = meta.hasAlpha ? "png" : "jpg"
  const anchos = [...new Set([...ANCHOS.filter((ancho) => ancho < width), width])]
  const anchoRespaldo = anchos.filter((ancho) => ancho <= ANCHO_RESPALDO).at(-1) ?? anchos[0]
  const foto = {
    ancho: width,
    alto: height,
    anchos,
    base: `/img/${sinExtension}`,
    respaldo: `/img/${sinExtension}-${anchoRespaldo}.${extensionRespaldo}`,
    huella,
  }

  const tareas = [
    ...anchos.flatMap((ancho) => ["avif", "webp"].map((formato) => ({ ancho, formato, extension: formato }))),
    { ancho: anchoRespaldo, formato: meta.hasAlpha ? "png" : "jpeg", extension: extensionRespaldo },
  ]
  await mkdir(path.dirname(path.join(DESTINO, relativa)), { recursive: true })
  for (const { ancho, formato, extension } of tareas) {
    await sharp(original).rotate().resize({ width: ancho }).toFormat(formato, CALIDAD[formato]).toFile(path.join(DESTINO, `${sinExtension}-${ancho}.${extension}`))
  }
  return { clave, foto, archivos: salidas(foto), generadas: tareas.length }
}

const originales = (await archivosDe(ORIGEN)).filter((ruta) => /\.(jpe?g|png)$/i.test(ruta))
const resultados = await Promise.all(originales.map(procesar))
resultados.sort((a, b) => a.clave.localeCompare(b.clave))

const esperadas = new Set(resultados.flatMap(({ archivos }) => archivos.map((archivo) => path.normalize(archivo))))
const sobrantes = (await archivosDe(DESTINO)).filter((archivo) => !esperadas.has(path.normalize(archivo)))
await Promise.all(sobrantes.map((archivo) => rm(archivo)))
for (const carpeta of [...new Set(sobrantes.map((archivo) => path.dirname(archivo)))].sort((a, b) => b.length - a.length)) {
  if (carpeta !== DESTINO) await rmdir(carpeta).catch(() => undefined)
}

const manifiesto = `${JSON.stringify(Object.fromEntries(resultados.map(({ clave, foto }) => [clave, foto])), null, 2)}\n`
if (JSON.stringify(anterior) !== JSON.stringify(JSON.parse(manifiesto))) await writeFile(MANIFIESTO, manifiesto)

const generadas = resultados.reduce((suma, { generadas }) => suma + generadas, 0)
console.log(`Fotos: ${resultados.length} originales, ${generadas} variantes nuevas${sobrantes.length ? `, ${sobrantes.length} sobrantes borradas` : ""}.`)
