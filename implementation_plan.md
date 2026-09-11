# Plan: Corrección de Color y Rediseño Anti-Recortes

## 1. Problema Actual
- **Color Incoherente:** El botón se cambió accidentalmente a gris oscuro/negro (`bg-slate-900`), rompiendo con el esquema de colores de la marca (verde/brand).
- **Espacio Horizontal Insuficiente:** En pantallas 16:9 con 5 columnas, el ancho interno de la tarjeta compite entre el contador de cantidad y el texto "Agregar", provocando que se vea muy apretado o se corte.

## 2. Solución Definitiva (Pasos de Implementación)

### Paso 1: Restaurar el Color de Marca
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambio:** Reemplazar `bg-slate-900` por `bg-brand-600 hover:bg-brand-700`.
- **Beneficio:** El botón volverá a respetar el color temático global configurable desde el panel de administración.

### Paso 2: Nuevo Acomodo "Cero Recortes" (Full-Width Button)
- **Problema de raíz:** Poner el precio, el contador de cantidad y el botón de agregar en líneas horizontales paralelas causa conflictos de espacio.
- **Cambio de Layout:** 
  Vamos a reestructurar el pie de la tarjeta para usar **dos líneas verticales** en lugar de amontonarlo todo horizontalmente:
  - **Línea Superior:** El Precio alineado a la izquierda, y el Contador de Cantidad alineado a la derecha. (Aprovechamos el espacio muerto junto al precio).
  - **Línea Inferior:** El botón de "Agregar" abarcará el **100% del ancho** de la tarjeta.
- **Beneficio:** 
  1. El botón de Agregar jamás se volverá a cortar, sin importar qué tan delgada sea la columna, porque tiene toda la tarjeta para sí mismo.
  2. Es una práctica estándar en e-commerce (como Amazon o MercadoLibre) tener el botón de acción principal a todo lo ancho.
  3. No aumentaremos casi nada la altura de la tarjeta porque estamos subiendo el contador al lado del precio.
