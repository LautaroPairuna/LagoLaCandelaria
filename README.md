# Lago La Candelaria

Sitio comercial del predio recreativo Lago La Candelaria: canotaje, tirolesa, restaurante, bungalows, campamentos y el resto de las actividades del lago. Es la web pública. No incluye un sistema de gestión.

## Cómo correrlo

Hace falta MySQL 8 en local, con la base `lago_la_candelaria`. Copiá `.env.example` a `.env` y poné la URL real.

```bash
npm install
npm run dev
```

La app queda en [http://127.0.0.1:4721](http://127.0.0.1:4721).

```bash
npm run lint
npm run build
```

## Páginas

- `/` inicio
- `/actividades` y `/actividades/[slug]`
- `/estadia`
- `/restaurante`
- `/grupos`
- `/reserva`

El catálogo de actividades está en `lib/activities.ts` para editarlo sin tocar el diseño.

La reserva valida el formulario con Zod, lo guarda en MySQL con Prisma y confirma la fecha por teléfono. No hay pago en la web.
