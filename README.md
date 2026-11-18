# AgroBoyacá - Prototipo Funcional TRL 4

Proyecto de Ingeniería II (Código 202337121) - UNAD, Grupo Colaborativo 172.
Plataforma web responsive para apoyar la comercialización directa de productos agropecuarios de Chinavita y municipios cercanos de Boyacá hacia consumidores de Bogotá D.C.

## Tecnologías

- React 19 + Vite
- Tailwind CSS v4
- React Router DOM
- Lucide React
- Supabase (PostgreSQL + Auth + RLS) con modo de laboratorio local incluido
- Vitest para pruebas unitarias y de integración

## Ejecución en local

```bash
pnpm install
pnpm dev
```

Para ejecutar la batería de pruebas de laboratorio TRL 4 desde terminal:

```bash
pnpm test
```

Para generar la compilación de producción:

```bash
pnpm build
```

## Cuentas demo de prueba rápida

En la pantalla `/ingresar` existen botones de acceso rápido con permisos acotados por rol:

- **Productor demo:** `productor.demo@agroboyaca.co` / `AgroBoyaca2026*` (Don Juan, Finca La Esperanza - Chinavita)
- **Consumidor demo:** `consumidor.demo@agroboyaca.co` / `AgroBoyaca2026*` (Camila Rojas - Bogotá D.C.)

## Conexión opcional con Supabase

La aplicación funciona de inmediato en modo laboratorio local usando persistencia en el navegador. Si deseas conectarla a PostgreSQL real:

1. Crea un proyecto en Supabase.
2. Ejecuta en el SQL Editor el archivo [supabase/schema.sql](supabase/schema.sql) y luego [supabase/seed.sql](supabase/seed.sql).
3. Copia `.env.example` a `.env` y asigna `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca expongas la clave `service_role` en el cliente.

## Despliegue en Cloudflare Pages

1. Sube este repositorio a GitHub.
2. En Cloudflare Pages conecta el repositorio con comando de compilación `pnpm build` y directorio de salida `dist`.
3. El archivo `public/_redirects` ya resuelve las rutas SPA al recargar el navegador.
