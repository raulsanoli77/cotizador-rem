# Plan: Reversión al Diseño Anterior y Optimización de Espacios

## 1. Problema Actual (Retroalimentación)
- **Recorte de Precio:** Al intentar apilar cantidad y precio en la misma línea horizontal, el precio se corta debido a la falta de espacio en tarjetas angostas.
- **Preferencia de Layout:** El usuario prefiere el diseño original donde el "Precio" tiene su propia línea, y en la línea de abajo conviven el "Contador" y el botón "Agregar".
- **Botón Cortado (Original):** El botón "Agregar" seguía viéndose apretado en la versión original junto al contador.
- **Detalles Estéticos:** Falta el acento de color verde en texto para dar contraste, y los precios deben verse más limpios (solo 2 decimales sin la extensión "MXN").

## 2. Solución y Ajustes (Pasos de Implementación)

### Paso 1: Optimización de la Cuadrícula para Ganar Espacio
- **Archivo:** `src/components/catalogo/ProductGrid.tsx`
- **Cambio:** Reducir la separación entre tarjetas (`gap-6` a `gap-3 sm:gap-4`).
- **Beneficio:** Al reducir el hueco "muerto" entre tarjetas, cada tarjeta gana valiosos píxeles de ancho, lo que le da más espacio a los botones interiores sin tener que reducir el número de columnas (se mantienen 5 máximo).

### Paso 2: Revertir Layout de Tarjeta y Ajustar Botones
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambios de Layout:**
  1. Devolver el **Precio** a su propia línea superior (nunca se cortará).
  2. Colocar el **Contador** y el botón **Agregar** juntos en la línea inferior (como te gustaba).
  3. Hacer el contador ligeramente más angosto (`w-[72px]` en lugar de `w-20`) y el botón `flex-1` con padding reducido (`px-1`). Además, usar la propiedad `truncate` y un tamaño de letra adaptativo (`text-[11px] sm:text-sm`) para que la palabra "Agregar" se encoja inteligentemente en lugar de romperse o desaparecer.

### Paso 3: Detalles Estéticos (Color y Precio Limpio)
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambio de Color:** El nombre de la **Categoría** pasará de ser gris a color **verde marca** (`text-brand-600 font-bold`). Esto da el contraste sutil y elegante que solicitaste.
- **Cambio de Precio:** Modificaremos la visualización para imprimir directamente el precio con formato numérico a 2 decimales (`$326.89`), omitiendo el texto "MXN" para que se vea ultra limpio y ahorre espacio visual.

## 3. Seguridad
- Las funciones de agregar al carrito y cálculos internos se mantienen intactas. 
- Los cambios son de distribución CSS (flexbox) para maximizar la usabilidad en espacios pequeños.
