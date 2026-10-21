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

Paneles:

- **Ocupación** (rol reservas): calendario del mes con el porcentaje de ocupación de cada día, las personas sobre la capacidad del predio y las reservas por propuesta. La capacidad (`AFORO_DEL_PREDIO` en `lib/predio/inventario.ts`) es provisoria hasta que el predio dé el número real.
- **Reservas** (rol reservas): buscador por nombre, institución, DNI, teléfono, número o código, con filtros de fecha, estado y propuesta; por defecto solo de hoy en adelante. El detalle agrupa a las personas por familia y destaca alergias y condiciones.
- **Lugares** (rol reservas): para un día, cada parrilla, quincho, gazebo, palapa, bungalow y mesa del restaurante libre u ocupado, y de quién es.
- **Puerta** (rol puerta): ingreso y cobranza del día elegido, con cobro del saldo (10 % menos en efectivo) y quiénes no vinieron. El ingreso se marca por persona, por familia o para todo el grupo. Al cobrar el total de un grupo que todavía no entró, se marca también que ingresaron todos (se puede destildar). En días futuros se puede cobrar una seña. "Llegó alguien sin reserva" carga una reserva de hoy con cobro e ingreso en el mismo paso (`app/panel/reservas/alta.ts`); en Reservas, "Nueva reserva" sirve para las que se toman por teléfono.
- **Caja** (rol caja): la plata del predio en dos cajones, **Caja · Efectivo** (el mostrador) y **Banco · Transferencia** (transferencia, tarjeta y otros medios). Ver "Caja" más abajo.
- **General** (solo administración): resumen de hoy, reportes por período y usuarios.
- **Restaurante** (rol restaurante): el salón del día por horario (cada mesa es una fila y cada reserva un bloque con el color de su estado, con la hora actual marcada) y las reservas de mesa ordenadas por horario, con alergias y condiciones a la vista. Se marca la llegada y la salida por persona, por familia o la mesa entera; ese rol solo puede marcar reservas de mesa.
- **Bar** (rol bar): cuentas y menú, igual que el restaurante pero sin salón (el bar no tiene mesas reservables).

### Estados de una reserva

Cada reserva se muestra con un color y un texto (`lib/panel/estados.ts`), iguales en Puerta, Reservas, Ocupación y el detalle:
**A confirmar** (amarillo), **Confirmada** (azul), **Ingreso parcial** (naranja, hasta que ingresó el 100 % de las personas), **Ingresada** (verde), **Finalizada** (gris) y **No vino** (rojo).
Pasado el día de la reserva, si ingresó alguien queda **Finalizada** sola (sin marcar salidas); si no ingresó nadie, **No vino**. Se calcula al leer, no hay tareas programadas.

La web no cobra ni pregunta la forma de pago: se decide en la puerta del predio.

### Restaurante

La mesa se reserva desde la web con el mismo flujo que la parrilla (personas, horario y día, mesa, confirmar) y queda como reserva de módulo Restaurante.
La reserva no tiene costo: se paga lo que consumen, en el restaurante (`cotizacionDeConsumo`, se ve como "Consumo aparte" en el ticket y en el panel).
Son 9 mesas según la planilla del predio: de 2 personas la 1, 5 y 7; de 4 la 2, 6 y 8; de 6 la 3, 4 y 9 (36 lugares). Un grupo puede juntar varias mesas, y para más de 36 personas se deriva a WhatsApp.
Las mesas se ocupan por hora, de 10 a 19 (`lib/predio/horario.ts`): cada reserva guarda una fila de `ocupaciones` por hora (`hora`; 0 es el día entero, como en los demás lugares), así la misma mesa puede tener una reserva de 12 a 14 y otra de 15 a 17, y el índice único frena a dos reservas que se pisan.
El bar no tiene mesas reservables: la planilla no las lista, así que las que había quedaron inactivas (migración `mesas_del_restaurante`).

### Restaurante y bar: menú y cuentas

Cada local tiene pestañas propias: el restaurante **Salón y reservas**, **Cuentas** y **Menú**; el bar **Cuentas** y **Menú** (`lib/panel/local.ts`).

- **Menú** (`menu_items`): categoría, nombre, descripción y precio. "Hay" destildado lo saca del menú digital sin borrarlo. Al lado está el QR para imprimir.
- **Menú digital** (`/menu/restaurante`, `/menu/bar`): la página pública a la que lleva el QR. Muestra solo lo que hay.
- **Cuentas** (`cuentas_de_mesa`, `cuenta_items`): se abre una cuenta por mesa (en el restaurante, con un toque desde las reservas del día), se suman platos de la carta o algo fuera de la carta, y se cobra en efectivo, débito o transferencia. Nombre y precio se copian al pedir: si cambia la carta, la cuenta no se mueve. Una cuenta cobrada se puede reabrir.
- Arriba, lo cobrado del día por forma de pago y lo pendiente. La pestaña **Caja** muestra lo cobrado por período; en la caja General se suma a las demás.

### Actividades y profesores

Con la entrada, cada persona puede hacer cada actividad **una sola vez por visita** (`actividades_realizadas`, con índice único por persona y actividad). Las actividades que se marcan son las que tienen profesor (`lib/panel/actividades.ts`): canotaje, tirolesa, parque aéreo, palestra, péndulo y caminata.

- **Profesores** (rol `profesor`): en General → Usuarios se les asigna qué actividades tienen a cargo (`profesores_actividad`). En **Actividades** ven las reservas del día con todos sus integrantes y marcan quién ya la hizo: persona por persona, por familia o todos juntos (y deshacer). Los grupos sin la lista de personas (estudiantiles) se cuentan con un contador. Se marca solo el día de la visita.
- **Administración** ve todas las actividades y la pestaña **Estadísticas**: actividades realizadas, visitantes que ingresaron, promedio por visitante, ranking de actividades (veces y porcentaje de visitantes), actividades por día (por semana en períodos largos) y por profesor.

### Cajas

Hay una caja por sección y una general que las junta (`lib/panel/caja.ts`, `lib/panel/libro-caja.ts`). Todas separan la plata en dos cajones: **Efectivo** (el mostrador) y **Banco** (transferencia, débito y otros).

- **General** (`/panel/caja`): suma reservas, restaurante y bar, más los egresos y pases entre cajones del predio. Tarjetas por cajón (ingreso, egreso y balance histórico a la fecha "Hasta"), una tabla **Por sección** (efectivo, banco, total y pendiente de cobro de cada una) y la lista de movimientos con filtros de cajón y de sección. Acá se cargan los **egresos** y los **pases entre cajones** (`movimientos_caja`), que se borran con el tacho. No hay ingresos manuales: la plata entra por una reserva o por una cuenta de los locales.
- **Reservas** (`/panel/caja/reservas`): los cobros de reservas, que entran cuando el grupo llega al predio (se dan de baja desde la reserva); **Pendiente de cobro** de reservas confirmadas con saldo, con la regla del descuento (todo en efectivo, 10 % menos; si entró algo por banco, precio de lista); y **Cobrado por adelantado**, las señas de grupos que todavía no llegaron.
- **Restaurante** y **Bar** (`/panel/caja/restaurante`, `/panel/caja/bar`, y la pestaña "Caja" de cada local): las cuentas cobradas por cajón y las que quedaron abiertas. Los encargados de cada local ven la suya; la general, solo administración y el rol caja.
- Por defecto se ven los últimos 30 días. "Exportar a Excel" baja la lista visible, con la sección de cada renglón y el resumen de los cajones al final.
- **Actividad** (`/panel/caja/actividad`): cobros, cobros anulados, cuentas cobradas o reabiertas, y movimientos cargados o borrados, con quién y cuándo.
- Pueden operar la administración y el rol `caja`. Puerta cobra y da de baja cobros, pero no ve la caja.

### Actividad del equipo

`/panel/general/actividad` (solo administración) muestra quién hizo qué dentro del panel, en la tabla `actividad` (`lib/panel/actividad.ts`, `lib/panel/registro.ts`). Cada renglón guarda la persona (`userId` y el nombre de ese momento), la sección, la acción y un detalle legible; la página muestra el nombre y el rol **actuales** de cada usuario.

- Se anota: entrar y salir del panel; reservas confirmadas, canceladas o cargadas desde el panel; ingresos, salidas y "deshacer" en Puerta y en el restaurante; cobros, cobros anulados y movimientos de caja; cambios en la carta, cuentas y pedidos del restaurante y el bar; actividades marcadas por los profesores; usuarios creados, permisos, contraseñas y altas o bajas.
- Filtros: período, persona, sección y búsqueda libre. Al costado, cuántas acciones hizo cada persona. "Exportar a Excel" baja lo filtrado.
- Anotar nunca frena la operación: si falla el registro, la acción igual se hace (los cobros y movimientos sí se anotan en la misma transacción).
- La caja (`/panel/caja/actividad`) sigue mostrando solo lo que mueve plata.

### Sitio web editable

`/panel/sitio` (solo administración) edita los textos y las fotos de la página, sección por sección. Cada sección se guarda entera en la tabla `contenidos` como JSON; mientras no se guarda, el sitio muestra lo que trae el código (`lib/contenido/secciones.ts`), así que se ve igual que antes.

- Secciones de esta etapa: **Contacto y redes** (WhatsApp, fijo, correo y redes, que alimentan «Más información», el ticket, los botones de WhatsApp y los datos estructurados), **Inicio** (portada, «Cómo reservar», «Nosotros» con las fotos del equipo y el pie) y **Propuestas** (tarjetas del recuadro, deportes en la naturaleza y profes).
- Cada sección se describe una sola vez con sus campos (`lib/contenido/campos.ts`): de ahí salen el formulario y la validación del servidor. Agregar una sección es sumar su tipo, sus valores de fábrica y sus campos.
- Las páginas del sitio leen el contenido en cada visita (una consulta por pedido), así lo guardado se ve al instante. Si la base no responde, se muestra lo de fábrica.
- «Volver al texto original» borra lo guardado de esa sección. Todo cambio queda en Actividad del equipo, sección «Sitio web».
- Fotos: se elige una de las del sitio o se sube una nueva (JPG, PNG, WEBP; hasta 15 MB). Al subirla se generan las versiones AVIF, WebP y JPG en los mismos anchos que `npm run fotos`, con 2560 px como máximo, y se sirven desde `/subidas/...`. El nombre de cada foto lleva su tamaño, así no hace falta otra tabla.

**Carpeta de fotos en producción.** Las fotos subidas no pueden quedar dentro del contenedor (se pierden en cada deploy). En Dokploy, en Advanced → Volumes, agregar un *Bind Mount* con Host Path `/srv/uploads/lago-la-candelaria` y Mount Path `/srv/uploads/lago-la-candelaria`, y en Environment `UPLOADS_DIR=/srv/uploads/lago-la-candelaria`. En el VPS, crear la carpeta antes del deploy (`mkdir -p /srv/uploads/lago-la-candelaria`) y sumarla a los backups. Sin `UPLOADS_DIR`, el panel no ofrece subir fotos (se pueden elegir las del sitio). En local se guardan en `subidas/`, que no se commitea.

### Reservas de la web: finde, bungalows y nado

Según el documento de modificaciones del predio (`components/reserva-nueva/flujo-visita.tsx`, `app/(sitio)/reserva/acciones.ts`).

- **Personas:** se cargan cantidades (adultos de 13 o más, menores de 5 a 12 y menores de 5, que no pagan) y solo los datos de quien reserva. Puerta y los profesores marcan esas reservas por cantidad.
- **Precio:** la tarifa depende del día (`lib/predio/tarifas.ts`): fin de semana o feriado, 40.000 y 25.000; de miércoles a viernes, 30.000 y 20.000. Son precios en efectivo; por transferencia se suma el 10 %. El cliente elige la forma de pago al elegir la fecha (se guarda en `reservas.formaPago`) y se paga al ingresar. El precio de lista de la reserva es el de transferencia; en efectivo, la caja cobra sin el recargo.
- **Calendario:** del 6/1 al 19/2 abre de miércoles a domingo; el resto del año, sábados, domingos y feriados (`TEMPORADA_DE_SEMANA` en `lib/predio/calendario.ts`). Los días puntuales se abren o cierran con los días especiales.
- **Lugares:** los menores de 5 no ocupan lugar. Parrillas: se ofrece solo el tamaño justo (6, 12 o 18) y el siguiente cuando ese se completa; más de 18 personas, WhatsApp (quincho). Gazebos (28, de la A a la Z con LL y Ñ) y palapas (84 cargadas, 54 en el predio): 4 personas cada uno, los asigna el sistema y el cliente no los elige. Por la web se ofrecen solo las primeras palapas del cupo (10 por defecto).
- **Restaurante:** con gazebo o palapa se pregunta si van a almorzar; el Panel Restaurante muestra quiénes avisaron.
- **Bungalows:** propuesta aparte. 2 días y 1 noche entrando jueves o sábado, 370.000 por bungalow con la entrada, pago anticipado por transferencia (el ticket muestra el alias).
- **Nado en aguas abiertas** (módulo `NADO`): nadadores, club opcional, fecha y hasta 3 horas entre las 10 y las 19. 25.000 el finde y 20.000 en semana por nadador; solo el nado.
- **Cotizar** (`/cotizar`) y **Ver mi reserva** (`/mi-reserva`, con código y celular): desde el ticket se modifica (mismo flujo, conserva código y QR) o se cancela (libera los lugares y queda cancelada). Queda en el registro como "Cliente (web)".
- **Reglamentos** (`lib/reglamentos.ts`, `/reglamento/finde|bungalow|nado`): el ticket los muestra con el horario de actividades y un botón para compartirlos con el grupo por WhatsApp.
- **Confirmaciones** (`/panel/reservas/confirmaciones`): las reservas del día siguiente con un botón que abre WhatsApp con el mensaje del predio (y el enlace para cancelar), y "Confirmó" o "No viene" (cancela y libera los lugares).
- **Ajustes de la web** (`/panel/general/ajustes`): cupo de palapas por la web y alias para la transferencia de los bungalows (tabla `ajustes`).

### Producción (guía de Next)

Se siguió la guía de producción que trae Next (`node_modules/next/dist/docs/01-app/02-guides/production-checklist.md`):

- **Páginas estáticas:** la portada se pregenera (el recuadro de reservas lee `?propuesta=` en el navegador, dentro de un `<Suspense>`). Las fichas de `/categorias` también, con `revalidate = 300` y renovación al editar la carta.
- **Content Security Policy** en `next.config.ts`, sin nonces para no perder las páginas estáticas: solo recursos propios, más los mosaicos del mapa (ArcGIS). Zod se configura sin `eval` en el navegador (`lib/zod-sin-eval.ts`).
- **Capa de datos solo del servidor:** `lib/prisma.ts` y `lib/auth.ts` importan `server-only`; si un componente del navegador los toca, la compilación falla. Los scripts (`seed`, `usuario:crear`, `db:migrar-legado`) corren con `--conditions=react-server`.
- **Server Actions:** cada acción del panel verifica el permiso por sí misma; las públicas tienen límite de intentos o piden el token secreto de la reserva.
- Lighthouse en celular: accesibilidad, buenas prácticas y SEO en 100 en las páginas internas.

### Errores y avisos

Ninguna pantalla muestra un error técnico. Las Server Actions pasan por `accion()` de `lib/errores.ts`: si algo sale mal, el detalle queda en el log del servidor (`[nombreDeLaAccion] ...`) y a la persona le llega una frase que dice qué pasó y qué hacer. Cuando el motivo es conocido (la reserva ya no estaba pendiente, no queda lugar) se tira `ErrorHumano` con el texto, o se usa `exigir(condición, "texto")`. El sitio público usa `mensajesDelSitio`, que ofrece el WhatsApp en vez de "avisá a la administración".

En el navegador, `lib/avisos.ts` muestra los toasts (`conAviso` corre la acción y avisa cómo salió) y distingue cuando se cortó internet. En los formularios, cada campo con problema queda marcado al lado, el toast lo resume y el foco va al primero.

### SEO

Los títulos, descripciones e imágenes al compartir de cada página están en `lib/seo.ts`, y `seoDePagina()` arma también la canonical y la vista previa (Open Graph y Twitter). `lib/seo.test.ts` controla que cada ficha tenga sus textos, que no se repitan y que entren en el resultado de búsqueda (título hasta 62 caracteres, descripción de 110 a 160). Al sumar una página o una ficha nueva hay que agregarle sus textos ahí.

### Migraciones al desplegar

En producción el sitio corre en modo standalone con Railpack (ver "Imagen de producción") y `arrancar.sh` aplica las migraciones pendientes (`prisma migrate deploy`) antes de levantar el servidor, así cada deploy deja la base al día. En local, `npm start` hace lo mismo. Las migraciones son aditivas (columnas e índices nuevos); si alguna llegara a ser destructiva hay que sacar un backup antes. Se corre desde el arranque y no desde el build porque el contenedor de build no ve la red interna de la base. Con más de una réplica conviene sacar este paso del arranque.

Si una migración falla, la app **arranca igual** (el error queda en el log, arriba de "ATENCION: las migraciones no se aplicaron"): así no se pierde el acceso al contenedor ni al resto del sistema mientras se corrige. Lo que dependa de la migración fallida va a dar error hasta resolverla. Para destrabarla: ver el motivo en `_prisma_migrations.logs`, corregir la base y marcarla como aplicada (desde la consola del contenedor: `node .next/standalone/migraciones/node_modules/prisma/build/index.js migrate resolve --applied <nombre> --config .next/standalone/migraciones/prisma7.config.ts`, o completando `finished_at` en `_prisma_migrations`).

Si hace falta aplicar una a mano (por ejemplo desde phpMyAdmin), además del SQL de `prisma/migrations/<nombre>/migration.sql` hay que anotarla en `_prisma_migrations` para que Prisma no la repita.

### Imagen de producción (Railpack + standalone)

`next.config.ts` tiene `output: "standalone"` y `railpack.json` arma una imagen que lleva solo `.next/standalone`. Sobre la plantilla base de standalone, este proyecto suma lo necesario para **migrar al arrancar**:

- `scripts/preparar-standalone.sh` (último paso del build): copia `.next/static` y `public/`, borra el `.env` que Next copia al standalone, e instala en `.next/standalone/migraciones/` el CLI de Prisma y `dotenv` en la versión del lockfile, con `prisma/` y `prisma7.config.ts`.
- `deploy.aptPackages: ["openssl"]`: el motor de migraciones de Prisma necesita la librería de OpenSSL. Sin ella no detecta la versión e intenta bajar otro motor al arrancar.
- `startCommand: sh .next/standalone/arrancar.sh`: aplica las migraciones (si fallan, sigue) y termina en `exec node --max-old-space-size=384 server.js`, así el único proceso que queda vivo es Node.
- `PORT=4721` y `HOSTNAME=0.0.0.0` en las variables del deploy; Node 22 fijado en `engines`.

El CLI de Prisma suma unos 250 MB a la imagen (trae Prisma Studio, que el CLI carga al iniciar y no se puede sacar). La app en sí son ~125 MB.

En Dokploy: Build Type **Railpack 0.39 o superior**, sin `NODE_OPTIONS` en Environment, Memory Limit de 768 MB y el dominio apuntando al puerto 4721. En el log del primer deploy tiene que aparecer "All migrations have been successfully applied" o "No pending migrations to apply".

### Pasar a producción

```bash
npm run db:preparar
npm run db:migrar-legado
npm run usuario:crear -- correo@dominio.com "Nombre" admin
```

En Dokploy tienen que estar `DATABASE_URL`, `SITE_URL` (también en el build), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) y `UPLOADS_DIR` con su bind mount (ver «Sitio web editable»).

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

La reserva (`/reserva`) se organiza en las tres propuestas de la presentación: finde en familia (parrilla o playa por día, bungalow por noche), propuesta estudiantil y actividad de aventura. Familia va en cuatro pasos: quiénes vienen (una o más familias; a los adultos se les pide DNI, a los niños no, y cada persona puede declarar algo importante como una alergia), la fecha (el calendario de `/api/calendario` marca en verde solo los días en que entra el grupo), el lugar (el cliente lo elige en la grilla de `/api/lugares` con las reglas de `lib/predio/eleccion.ts`) y la confirmación. El precio sale de las edades; estudiantil y aventura mandan un pedido de servicio con el presupuesto a confirmar. Todo se valida con Zod en Server Actions (`app/(sitio)/reserva/acciones.ts`). No hay pago en la web: queda un ticket con QR y el predio confirma por WhatsApp.
