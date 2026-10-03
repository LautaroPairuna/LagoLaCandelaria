# Lago La Candelaria

Sitio comercial del predio recreativo Lago La Candelaria: canotaje, tirolesa, restaurante, bungalows, campamentos y el resto de las actividades del lago. Es la web pública. No incluye un sistema de gestión.

## Cómo correrlo

Hace falta MySQL 8 o MariaDB en local, con la base `lago_la_candelaria`. Copiá `.env.example` a `.env` y completá `DATABASE_URL`, `BETTER_AUTH_SECRET` y `SITE_URL` (la URL pública: la usan el sitemap, Open Graph y el QR del ticket; en Dokploy tiene que estar también en el build).

```bash
npm install
npm run db:preparar
npm run dev
```

`db:preparar` aplica las migraciones y carga las unidades del predio y los feriados (`prisma/seed.mts`). Se puede correr las veces que haga falta: si cambia el inventario en `lib/predio/inventario.ts`, se vuelve a correr y actualiza la tabla `unidades`.

La app queda en [http://127.0.0.1:4721](http://127.0.0.1:4721).

```bash
npm run lint
npm test
npm run build
```

## Base de datos

| Tabla | Qué guarda |
| --- | --- |
| `reservas` | Una fila por reserva. El `id` es el número de reserva de las planillas; el `token` va en el link del ticket. |
| `clientes` | Quien reserva, identificado por DNI. Permite ver si es cliente nuevo. |
| `reserva_personas` | Cada integrante de un grupo familiar con su edad (para el tablero por rango etario). |
| `unidades` | Parrillas, quinchos, gazebos, palapas, bungalows y mesas. Se cargan desde `lib/predio/inventario.ts`. |
| `ocupaciones` | Qué unidad está tomada qué día. Su índice único impide que dos reservas tomen el mismo lugar. |
| `pagos` | Señas y cuotas. |
| `dias_especiales` | Feriados, días no laborables y cierres o aperturas puntuales. |

Las reglas del predio (tarifas, calendario de apertura, asignación de parrillas y playa, regla de bungalows, teléfono) están en `lib/predio/`, con sus tests.

## Panel del predio

El equipo entra por `/ingresar`. No hay registro abierto: cada usuario se crea con un rol, y cada rol ve solo su panel (la administración ve todos).

```bash
npm run usuario:crear -- correo@dominio.com "Nombre Apellido" reservas
```

Roles: `admin`, `reservas`, `puerta`, `bar`, `restaurante`. Se pueden combinar separados por coma (`reservas,puerta`). El comando imprime una contraseña inicial.

Paneles (según la presentación del proyecto): Funcionan Reservas (calendario del mes por propuesta, a confirmar, confirmadas, detalle con confirmar, cancelar y aviso por WhatsApp) Puerta (lista del día, marcar ingreso, cobro del saldo con 10 % en efectivo, otro importe y caja del día). General (resumen de hoy con ocupación y caja, reportes por período con variación contra el período anterior, personas por mes, reservas por propuesta, edad de quien reserva y clientes nuevos, y usuarios y permisos: alta, paneles, contraseña nueva y deshabilitar). Bar y Restaurante aparecen como "Pronto".

### Errores y avisos

Ninguna pantalla muestra un error técnico. Las Server Actions pasan por `accion()` de `lib/errores.ts`: si algo sale mal, el detalle queda en el log del servidor (`[nombreDeLaAccion] ...`) y a la persona le llega una frase que dice qué pasó y qué hacer. Cuando el motivo es conocido (la reserva ya no estaba pendiente, no queda lugar) se tira `ErrorHumano` con el texto, o se usa `exigir(condición, "texto")`. El sitio público usa `mensajesDelSitio`, que ofrece el WhatsApp en vez de "avisá a la administración".

En el navegador, `lib/avisos.ts` muestra los toasts (`conAviso` corre la acción y avisa cómo salió) y distingue cuando se cortó internet. En los formularios, cada campo con problema queda marcado al lado, el toast lo resume y el foco va al primero.

### Pasar a producción

```bash
npm run db:preparar
npm run db:migrar-legado
npm run usuario:crear -- correo@dominio.com "Nombre" admin
```

En Dokploy tienen que estar `DATABASE_URL`, `SITE_URL` (también en el build) y `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

`db:migrar-legado` copia las solicitudes de la tabla vieja `reservation_inquiries` a las tablas nuevas, con el mismo link de ticket. Se puede correr más de una vez: saltea lo que ya pasó. La tabla vieja queda hasta confirmar que está todo; después se borra con una migración.

## Páginas

- `/` inicio
- `/actividades` y `/actividades/[slug]`
- `/estadia`
- `/restaurante`
- `/grupos`
- `/reserva`

El catálogo de actividades está en `lib/activities.ts` para editarlo sin tocar el diseño.

## Fotos y videos

Las fotos originales van en `fotos/`. `npm run fotos` (corre solo antes de `dev` y `build`) las pasa por sharp y deja en `public/img/` las versiones AVIF, WebP y JPG en varios anchos, más `lib/fotos.generadas.json` con las medidas. Nada de eso se commitea. En el código se usa `<Foto src="/covers/lago.jpg" … />` con la ruta relativa a `fotos/`.

Los videos de fondo están en `public/` a 720p y alrededor de 1,5 Mbps. Si se cambia uno, recodificarlo igual y sacar el póster en `fotos/posters/`:

```bash
ffmpeg -i original.mp4 -an -vf "scale=1280:-2,fps=25" -c:v libx264 -preset slow -crf 27 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -movflags +faststart public/hero.mp4
ffmpeg -i public/hero.mp4 -frames:v 1 -q:v 2 fotos/posters/hero.jpg
```

La reserva (`/reserva`) se organiza en las tres propuestas de la presentación: finde en familia (parrilla o playa por día, bungalow por noche), propuesta estudiantil y actividad de aventura. Familia muestra el calendario en verde y rojo (`/api/calendario`), asigna el lugar automáticamente y calcula el precio; estudiantil y aventura mandan un pedido de servicio con el presupuesto a confirmar. Todo se valida con Zod en Server Actions (`app/(sitio)/reserva/acciones.ts`). No hay pago en la web: queda un ticket con QR y el predio confirma por WhatsApp.
