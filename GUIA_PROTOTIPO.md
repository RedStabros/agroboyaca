# Cómo se armó el prototipo web de AgroBoyacá

Este documento explica en lenguaje sencillo qué hace la plataforma, cómo está organizada por dentro y cómo recorrerla para grabaciones o revisiones en grupo.

## De dónde partimos

En la Fase 3 definimos 8 requerimientos funcionales, 8 no funcionales y unas pantallas de ejemplo en Figma. Esas pantallas servían para mostrar colores y distribución, pero no tenían lógica detrás. Los datos eran fijos, los botones no guardaban cambios y había detalles visuales por ajustar, como textos superpuestos en el pedido 1042 y una suma que no coincidía con los productos listados.

Para la Fase 4 convertimos esa propuesta visual en una aplicación web real que corre en cualquier navegador, tanto en celular como en computador, sin necesidad de instalar servidores ni bases de datos externas.

## Qué herramientas usamos y por qué

Construimos la página con React en JavaScript puro y estilos con Tailwind CSS. Elegimos JavaScript en lugar de TypeScript para que cualquier integrante del equipo pueda abrir los archivos, leer los nombres de las funciones y entender qué pasa en cada pantalla sin pelear con tipos complejos.

La fuente tipográfica (Manrope), los íconos (Lucide) y las ocho fotografías de productos boyacenses viven dentro del mismo proyecto. Así evitamos que una imagen se rompa si falla un enlace externo cuando alguien abra la página o cuando estemos grabando el video.

Para simular una base de datos real sin complicar el despliegue en Cloudflare Pages, toda la información (usuarios, cultivos, existencias, pedidos y calificaciones) se guarda en el `localStorage` del navegador. Cuando el usuario entra por primera vez, el sistema carga automáticamente las fincas, los ocho productos iniciales y tres pedidos de ejemplo para probar los estados de inmediato.

## Cómo funciona la seguridad y los roles

Aunque es un entorno académico de prueba, aplicamos tres reglas básicas para evitar fallos comunes:

1. Las contraseñas nunca se guardan como texto legible. Al registrar un usuario o cargar las cuentas demo, el archivo `src/lib/crypto.js` genera un valor aleatorio llamado salt y calcula un resumen SHA-256 usando la API criptográfica del navegador.
2. Un consumidor no puede entrar al panel de finca ni crear o editar productos. Un productor tampoco puede cambiar precios o inventario de una finca que no sea suya.
3. Un consumidor solo puede enviar una calificación con estrellas cuando el pedido ya aparece como Entregado, y el sistema bloquea calificaciones repetidas sobre el mismo producto.

En `/ingresar` dejamos dos botones de acceso rápido (Productor Demo y Consumidor Demo) para cambiar de rol con un clic durante las pruebas o en la sustentación, además del formulario completo de registro que pide rol, finca o ciudad y la aceptación del uso académico de datos.

## Estructura de carpetas explicada

Si algún compañero necesita ubicar una parte del código o explicarla en el informe, todo se divide en cinco bloques dentro de `src/`:

- `src/data/seedData.js`: contiene los datos iniciales de ejemplo (productores de Chinavita, Sutamarchán y Villa de Leyva, los ocho productos, los pedidos iniciales, la matriz de requerimientos y los hallazgos corregidos frente a Figma).
- `src/services/agroService.js`: concentra las reglas del negocio. Aquí están las funciones para registrar usuarios, validar contraseñas, crear o editar cultivos, descontar existencias al confirmar un pedido, devolver existencias si se cancela y ejecutar la batería de pruebas de laboratorio.
- `src/context/AppContext.jsx`: conecta esos servicios con la interfaz para que al sumar un producto al carrito o cambiar el estado de un pedido, todas las pantallas se actualicen al instante.
- `src/components/`: guarda piezas reutilizables como la barra de navegación (`Navbar.jsx`), las tarjetas de cultivo (`ProductCard.jsx`), la ventana de detalle (`ProductModal.jsx`), la canasta lateral (`CartDrawer.jsx`) y la línea de tiempo del pedido (`OrderTimeline.jsx`).
- `src/pages/`: contiene las cinco vistas principales de la aplicación: catálogo (`CatalogPage.jsx`), acceso y registro (`AuthPage.jsx`), seguimiento de pedidos (`OrdersPage.jsx`), panel de finca (`ProducerDashboard.jsx`) y laboratorio de validación (`LabTrl4Page.jsx`).

## Qué revisar en el módulo Lab TRL 4

La pestaña `Lab TRL 4` sirve para comprobar con datos medibles que la lógica integrada funciona. Al pulsar el botón de ejecución, corre nueve pruebas automáticas reales sobre los servicios (control de acceso, bloqueo de existencias negativas, prevención de sobreventa, flujo de estados y restricciones de valoración), mide cuántos milisegundos tarda cada una y permite descargar el reporte en JSON. También muestra la resolución actual de la pantalla en vivo para verificar que la interfaz responde bien en móvil y escritorio.

Si durante una prueba o después de una demostración alguien quiere volver al estado limpio del inicio, basta con pulsar el botón "Restablecer datos demo" dentro de esa misma pestaña.
