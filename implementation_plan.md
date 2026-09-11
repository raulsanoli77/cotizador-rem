# Plan: Buscador Global → Descubridor de Categorías

## 1. Problema Actual
El buscador de la barra superior (Header) y el buscador interno del catálogo son redundantes. Ambos filtran productos por texto, pero el usuario no necesita dos buscadores para lo mismo.

## 2. Nuevo Concepto
Convertir el buscador del Header en un **"Descubridor de Categorías"**:

- El usuario escribe **"3/8"** desde cualquier página → se abre `/buscar?q=3/8`
- La nueva pantalla muestra las **categorías que contienen artículos** con esa medida
- Ejemplo: "Endmills (24 productos)", "Brocas (8 productos)"
- El usuario da clic en la categoría que le interesa → llega al catálogo ya filtrado en esa sección

Esto separa responsabilidades:
- **Barra superior** = "¿En qué categoría encuentro lo que busco?" (descubrimiento)
- **Barra del catálogo** = "Buscar producto específico dentro de esta categoría" (precisión)

## 3. Pasos de Implementación

### Paso 1: Crear la Página de Resultados `/buscar`
- **Archivo nuevo:** `src/app/buscar/page.tsx`
- **Lógica:**
  1. Lee el parámetro `?q=` de la URL
  2. Consulta TODOS los productos activos de Supabase (limit 2500)
  3. Filtra localmente por coincidencia profunda (número de parte, marca, descripción, especificaciones) — exactamente como lo hace el catálogo
  4. Agrupa los resultados por `producto.categoria`
  5. Muestra tarjetas de categoría con: imagen de la categoría, nombre, y el conteo de productos que coinciden
  6. Al dar clic → navega a `/catalogo?categoria=Endmills`
- **Diseño:** Fondo oscuro (`slate-900`) consistente con la estética de REM. Reutilizaremos el estilo de las tarjetas de `CategoryShowcase` para mantener coherencia visual.

### Paso 2: Cambiar el Destino del Header
- **Archivo:** `src/components/layout/Header.tsx`
- **Cambio:** Redirigir de `/catalogo?q=...` a `/buscar?q=...`
- **Placeholder nuevo:** `"Buscar categorías por medida, material, recubrimiento..."`

### Paso 3: Incluir Header y Footer en la Nueva Página
- La página `/buscar` tendrá `<Header />` arriba y `<Footer />` abajo para mantener la navegación completa.

## 4. Observación Adicional

> [!TIP]
> **Caso "sin resultados":** Si la búsqueda no coincide con ningún producto en ninguna categoría, mostraremos un mensaje amigable con un botón para ir directo al catálogo completo.

> [!TIP]
> **Caso "una sola categoría":** Si solo hay coincidencia en UNA categoría, podríamos redirigir automáticamente al catálogo de esa categoría en lugar de mostrar una pantalla con una sola tarjeta. ¿Te gustaría este comportamiento o prefieres siempre ver la pantalla de categorías?

## 5. Seguridad
- El catálogo y sus filtros, chips, paginación y ordenamiento NO se tocan.
- La nueva página es completamente independiente: un archivo nuevo que no modifica ningún componente existente excepto la URL de destino en el Header.
