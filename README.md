# AgroBoyacá - Prototipo Funcional TRL 4

Proyecto de Ingeniería II (Código 202337121) - UNAD, Grupo Colaborativo 172.
Plataforma web responsive para apoyar la comercialización directa de productos agropecuarios de Chinavita y municipios cercanos de Boyacá hacia consumidores de Bogotá D.C.

## Tecnologías

- React 19 + JavaScript
- Vite
- Tailwind CSS v4
- React Router DOM
- Lucide React
- Vitest para pruebas unitarias y de integración

## Ejecución en local

```bash
pnpm install
pnpm dev
```

Para ejecutar las pruebas de validación desde terminal:

```bash
pnpm test
```

Para generar la compilación de producción:

```bash
pnpm build
```

## Cuentas demo de prueba rápida

En la pantalla `/ingresar` hay botones de acceso rápido por rol:

- **Productor demo:** `productor.demo@agroboyaca.co` / `AgroBoyaca2026*` (Juan Carlos Mendoza, Finca La Esperanza - Chinavita)
- **Consumidor demo:** `consumidor.demo@agroboyaca.co` / `AgroBoyaca2026*` (Camila Rojas - Bogotá D.C.)

## Despliegue en Cloudflare Pages

1. Sube este repositorio a GitHub.
2. En Cloudflare Pages conecta el repositorio con comando de compilación `pnpm build` y directorio de salida `dist`.
3. El archivo `public/_redirects` resuelve las rutas SPA al recargar el navegador.
