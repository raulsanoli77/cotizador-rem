# Plan: Ajuste Micrométrico de Controles (Ultra-Compacto)

## 1. Problema Restante
- En el monitor panorámico (donde caben 5 columnas con márgenes), los botones siguen peleando por espacio horizontal, ocasionando que la palabra "Agregar" se corte ("Agrega") en resoluciones donde las tarjetas se hacen muy delgadas justo antes del quiebre responsivo.

## 2. Solución: Layout Ultra-Compacto

### Ajustes en la Caja de Cantidad:
- **Reducción de ancho:** Cambiamos de `w-[72px]` a `w-[64px]`.
- **Reducción de texto:** El número de cantidad pasa de `text-sm` a `text-xs`.
- **Botones interiores:** Reducimos ligeramente el padding (`px-1.5 py-1.5`) manteniendo el área táctil funcional.

### Ajustes en el Botón "Agregar":
- **Icono más sutil:** Reducimos el carrito de `h-4 w-4` a `h-3.5 w-3.5`.
- **Texto estricto:** Fijamos el texto en `text-[11px]` (muy compacto pero legible) y eliminamos la regla `sm:text-sm` (que era la culpable de que la letra se agrandara y se cortara en el monitor grande).
- **Separación (Gap):** Bajamos el margen entre el icono y la letra a `gap-1` para exprimir cada píxel útil.

### Previos Ya Aplicados y Comprobados:
- El precio ya tiene la estructura "192.14" en grande y "MXN" en pequeño.
- El color verde ya está aplicado al nombre de la categoría para dar un contraste sutil (si no lo has visto, asegúrate de refrescar la página).

## 3. Seguridad
- Ninguna función de cálculo o base de datos se ve alterada. Estos cambios son puramente micrométricos en las clases de Tailwind CSS para garantizar que el diseño "viejito" (lado a lado) funcione perfectamente sin romperse jamás en 5 columnas.
