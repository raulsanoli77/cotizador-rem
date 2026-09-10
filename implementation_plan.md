# Plan: Rediseño del Catálogo a Cuadrícula de Tarjetas Verticales

## 1. Objetivo
Migrar la vista actual del catálogo (filas horizontales tipo lista) a una cuadrícula moderna de tarjetas verticales (Grid), tomando los elementos más limpios de Weston Tools y la estructura jerárquica de Berkshire eSupply, pero adaptándolo al estilo moderno de REM Industrial.

## 2. Modificaciones al Código

### A. Contenedor del Catálogo (`src/components/catalogo/ProductGrid.tsx`)
- Cambiaremos el contenedor principal de una lista vertical (`flex-col`) a un **Grid responsivo**.
- Se mostrará: 1 columna en móviles, 2 en tablets, 3 en pantallas medianas y **4 columnas en laptops/monitores grandes** (para aprovechar bien el espacio y ver muchos productos a la vez).

### B. Tarjeta del Producto (`src/components/catalogo/ProductCard.tsx`)
Se reestructurará completamente el HTML interno de la tarjeta para ser vertical (`flex-col h-full`):

1. **Área de Imagen (Inspirado en Weston):**
   - Una caja cuadrada grande y prominente en la parte superior (`aspect-square`).
   - Fondo sutil gris claro que cambia a blanco puro al pasar el mouse.
   - La etiqueta de la "MARCA" se colocará como una placa elegante en una de las esquinas superiores.

2. **Área de Información (Inspirado en Berkshire + Estilo REM):**
   - **No. Parte:** Será el protagonista. Letra grande, negrita y técnica (`font-mono text-lg text-brand-900`).
   - **Descripción:** Texto en gris oscuro, siempre truncado a 2 renglones (para que todas las tarjetas midan exactamente lo mismo y no se vea una cuadrícula desordenada).

3. **Área de Compra (Fija al fondo de la tarjeta):**
   - Una línea divisoria sutil.
   - **Precio:** Muy destacado en tamaño grande.
   - **Controles:** El selector de cantidad `[ - | 1 | + ]` y un botón azul de "Agregar" que ahora **ocuparán todo el ancho de la tarjeta**. Esto facilita muchísimo darle clic desde el celular o con el mouse.

## 3. Seguridad
- **Sin afectaciones lógicas:** El carrito, el modal de detalles (al hacer clic), el formateo de moneda y los filtros de la barra lateral seguirán funcionando exactamente igual, ya que solo estamos cambiando clases de CSS (Tailwind) y estructura HTML (DOM), no la lógica de la base de datos ni los estados de React.
