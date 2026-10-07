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
- **Puerta** (rol puerta): ingreso y cobranza del día elegido, con cobro del saldo (10 % menos en efectivo) y quiénes no vinieron. El ingreso se marca por persona, por familia o para todo el grupo.
- **Caja** (solo administración): cobros del período por forma de pago, con descarga en CSV.
- **General** (solo administración): resumen de hoy, reportes por período y usuarios.
- **Restaurante** (rol restaurante): el salón del día por horario (cada mesa es una fila y cada reserva un bloque con el color de su estado, con la hora actual marcada) y las reservas de mesa ordenadas por horario, con alergias y condiciones a la vista. Se marca la llegada y la salida por persona, por familia o la mesa entera; ese rol solo puede marcar reservas de mesa.
- Bar aparece como "Pronto".

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

### Errores y avisos

Ninguna pantalla muestra un error técnico. Las Server Actions pasan por `accion()` de `lib/errores.ts`: si algo sale mal, el detalle queda en el log del servidor (`[nombreDeLaAccion] ...`) y a la persona le llega una frase que dice qué pasó y qué hacer. Cuando el motivo es conocido (la reserva ya no estaba pendiente, no queda lugar) se tira `ErrorHumano` con el texto, o se usa `exigir(condición, "texto")`. El sitio público usa `mensajesDelSitio`, que ofrece el WhatsApp en vez de "avisá a la administración".

En el navegador, `lib/avisos.ts` muestra los toasts (`conAviso` corre la acción y avisa cómo salió) y distingue cuando se cortó internet. En los formularios, cada campo con problema queda marcado al lado, el toast lo resume y el foco va al primero.

### SEO

Los títulos, descripciones e imágenes al compartir de cada página están en `lib/seo.ts`, y `seoDePagina()` arma también la canonical y la vista previa (Open Graph y Twitter). `lib/seo.test.ts` controla que cada ficha tenga sus textos, que no se repitan y que entren en el resultado de búsqueda (título hasta 62 caracteres, descripción de 110 a 160). Al sumar una página o una ficha nueva hay que agregarle sus textos ahí.

### Migraciones al desplegar

`npm start` aplica las migraciones pendientes (`prisma migrate deploy`) antes de levantar la app, así cada deploy deja la base al día. Las migraciones son aditivas (columnas e índices nuevos); si alguna llegara a ser destructiva hay que sacar un backup antes. Se corre desde el arranque y no desde el build porque el contenedor de build no ve la red interna de la base. Con más de una réplica conviene sacar este paso del arranque.

Si hace falta aplicar una a mano (por ejemplo desde phpMyAdmin), además del SQL de `prisma/migrations/<nombre>/migration.sql` hay que anotarla en `_prisma_migrations` para que Prisma no la repita.

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

La reserva (`/reserva`) se organiza en las tres propuestas de la presentación: finde en familia (parrilla o playa por día, bungalow por noche), propuesta estudiantil y actividad de aventura. Familia va en cuatro pasos: quiénes vienen (una o más familias; a los adultos se les pide DNI, a los niños no, y cada persona puede declarar algo importante como una alergia), la fecha (el calendario de `/api/calendario` marca en verde solo los días en que entra el grupo), el lugar (el cliente lo elige en la grilla de `/api/lugares` con las reglas de `lib/predio/eleccion.ts`) y la confirmación. El precio sale de las edades; estudiantil y aventura mandan un pedido de servicio con el presupuesto a confirmar. Todo se valida con Zod en Server Actions (`app/(sitio)/reserva/acciones.ts`). No hay pago en la web: queda un ticket con QR y el predio confirma por WhatsApp.
