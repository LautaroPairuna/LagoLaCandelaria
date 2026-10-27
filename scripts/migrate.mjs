// Aplica las migraciones de prisma/migrations al arrancar, sin el CLI de Prisma.
// Escribe en _prisma_migrations igual que `prisma migrate deploy` (checksum = sha256 del
// migration.sql), así que `prisma migrate status/deploy/resolve` siguen funcionando.
// En el build se empaqueta con esbuild (mariadb incluido) a .next/standalone/migrate.cjs:
// así no depende de qué copie Next al node_modules del standalone.
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as esperar } from "node:timers/promises";
import mariadb from "mariadb";

async function main() {
  const dir = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "prisma", "migrations");
  const url = new URL(process.env.DATABASE_URL);

  // Los parámetros de la URL (?ssl=..., ?allowPublicKeyRetrieval=...) pasan al driver.
  const extra = Object.fromEntries(
    [...url.searchParams].map(([k, v]) => [k, v === "true" ? true : v === "false" ? false : /^\d+$/.test(v) ? Number(v) : v]),
  );
  const opciones = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    // MySQL 8 (caching_sha2_password) sin SSL: sin esto falla con la caché de
    // autenticación fría, por ejemplo después de reiniciar MySQL.
    allowPublicKeyRetrieval: true,
    connectTimeout: 5000,
    ...extra,
    multipleStatements: true,
  };

  // La base puede tardar unos segundos en aceptar conexiones después de un reinicio.
  let conn;
  for (let intento = 1; !conn; intento++) {
    try {
      conn = await mariadb.createConnection(opciones);
    } catch (error) {
      if (intento === 5) throw error;
      console.log(`la base no responde (${error.code ?? error.message}), reintento en 3 s`);
      await esperar(3000);
    }
  }

  // Un migration.sql guardado con CRLF en Windows y con LF en el repo (o al revés) es el
  // mismo archivo: se aceptan los dos checksums.
  const sha = (texto) => createHash("sha256").update(texto).digest("hex");
  const checksums = (sql) => new Set([sha(sql), sha(sql.replace(/\r\n/g, "\n")), sha(sql.replace(/\r?\n/g, "\r\n"))]);

  try {
    const [{ got }] = await conn.query("SELECT GET_LOCK('prisma_migrate', 60) AS got");
    if (Number(got) !== 1) throw new Error("No se pudo tomar el lock de migraciones.");

    await conn.query(`CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) NOT NULL, checksum VARCHAR(64) NOT NULL, finished_at DATETIME(3) NULL,
      migration_name VARCHAR(255) NOT NULL, logs TEXT NULL, rolled_back_at DATETIME(3) NULL,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (id)
    ) DEFAULT CHARSET=utf8mb4`);

    // Una migración puede tener varias filas (un intento fallido marcado con
    // `migrate resolve --rolled-back` y el reintento): vale la que no fue revertida.
    const filas = await conn.query("SELECT * FROM _prisma_migrations ORDER BY started_at");
    const aplicadas = new Map();
    for (const fila of filas) {
      if (!fila.rolled_back_at) aplicadas.set(fila.migration_name, fila);
    }

    const nombres = (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    let corridas = 0;
    for (const nombre of nombres) {
      const sql = await readFile(path.join(dir, nombre, "migration.sql"), "utf8");
      const fila = aplicadas.get(nombre);
      if (fila) {
        if (!fila.finished_at) {
          throw new Error(`La migración ${nombre} quedó a medias: revisarla y usar \`prisma migrate resolve\`.`);
        }
        if (!checksums(sql).has(fila.checksum)) throw new Error(`La migración ${nombre} cambió después de aplicarse.`);
        continue;
      }
      const id = randomUUID();
      await conn.query("INSERT INTO _prisma_migrations (id, checksum, migration_name) VALUES (?, ?, ?)", [id, sha(sql), nombre]);
      try {
        await conn.query(sql);
      } catch (error) {
        await conn.query("UPDATE _prisma_migrations SET logs = ? WHERE id = ?", [String(error.message), id]).catch(() => {});
        throw error;
      }
      await conn.query("UPDATE _prisma_migrations SET finished_at = NOW(3), applied_steps_count = 1 WHERE id = ?", [id]);
      console.log(`migración aplicada: ${nombre}`);
      corridas++;
    }
    console.log(corridas ? `${corridas} migraciones aplicadas` : "sin migraciones pendientes");
  } finally {
    await conn.query("SELECT RELEASE_LOCK('prisma_migrate')").catch(() => {});
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
