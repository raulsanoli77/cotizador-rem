# Plan: Optimización Visual del Catálogo (Responsive & Proporciones)

## 1. Problema Actual
- **Pantallas Cuadradas/Laptops:** Hay mucho espacio en blanco desperdiciado en los laterales, el contenedor principal está limitado y no se expande a lo ancho.
- **Monitores (16:9):** Las tarjetas de producto son demasiado altas (muy largas verticalmente) porque la imagen está forzada a ser completamente cuadrada (`aspect-square` 1:1), lo que escala su altura de forma exagerada cuando la tarjeta se ensancha. Esto empuja la información hacia abajo y reduce cuántos productos caben en pantalla.

## 2. Pasos de Implementación

### Paso 1: Aprovechar el Espacio Lateral (Contenedor Más Ancho)
- **Archivo:** `src/app/catalogo/page.tsx`
- **Cambio:** El contenedor principal actualmente usa `max-w-7xl` (1280px). Lo ampliaremos a `max-w-[1600px]` con márgenes responsivos (`px-4 sm:px-6 lg:px-8`).
- **Resultado:** La interfaz "respirará" mejor en monitores grandes y laptops, llenando el espacio horizontal desperdiciado.

### Paso 2: Aumentar el Número de Columnas
- **Archivo:** `src/components/catalogo/ProductGrid.tsx`
- **Cambio:** Modificar la cuadrícula. Actualmente está topada a 4 columnas (`xl:grid-cols-4`). La cambiaremos a un modelo más denso: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`.
- **Resultado:** Tendrás 5 productos por fila en pantallas estándar y hasta 6 en monitores muy anchos. Esto hace las tarjetas naturalmente más esbeltas.

### Paso 3: Reducir Altura de Tarjetas (≈20% más pequeñas)
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambio:** Reemplazar el contenedor de imagen `aspect-square` (proporción 1:1) por `aspect-[4/3]` o `aspect-[5/4]`. 
- **Resultado:** La fotografía seguirá viéndose perfecta y contenida (`object-contain`), pero la "caja" será rectangular (más ancha que alta), reduciendo la altura total de la tarjeta aproximadamente un 20%. Toda la información clave (precio, botón de agregar) subirá y será visible sin necesidad de *scroll*.

## 3. Seguridad y Diseño
- Estas modificaciones son **estrictamente de CSS (Tailwind)**. No afectarán las funciones del carrito, precios o filtros.
- Mantendremos tus estilos preferidos (fuentes, distribución interior de la tarjeta, colores oscuros y estilos de cajas). Solo estamos alterando las dimensiones exteriores y la densidad de la cuadrícula.
