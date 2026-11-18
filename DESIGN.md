# Sistema visual - AgroBoyacá

## Paleta principal

- Verde campo primario: `#2E7D32` (hover `#236327`, fondo suave `#EAF4EB`)
- Tierra / cosecha (acento secundario): `#9A5B08` (fondo suave `#FFF4E5`)
- Fondo general: `#F6F8F6`
- Superficie de tarjetas: `#FFFFFF`
- Bordes: `#DCE5DD`
- Texto principal: `#18221A`
- Texto secundario: `#4A5A4E`

## Tipografía

- Familia principal: `Manrope` (cargada localmente con `@fontsource/manrope`)
- Cifras en pesos colombianos y cantidades con `font-variant-numeric: tabular-nums` para evitar saltos de alineación.

## Correcciones frente a la maqueta previa de Fase 3

1. En el detalle del pedido se separó el número de orden de la insignia de estado para evitar superposición de texto.
2. En el catálogo se ajustó la altura y el espaciado de los chips de categoría para evitar recortes verticales.
3. Los totales de pedido y subtotales se calculan dinámicamente desde precio unitario por cantidad.
4. La autenticación implementa correo único, contraseña protegida y aceptación explícita de uso de datos en lugar de pantallas estáticas por SMS.
5. Los indicadores de pago se reemplazaron por avisos claros de pedido académico de prueba sin cobros reales.
