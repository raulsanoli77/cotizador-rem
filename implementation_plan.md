# Plan: Correcciones de Búsqueda y Filtros del Catálogo

## 1. Problema Actual

### A. Typo en el Buscador Principal
El placeholder del `Header.tsx` dice `"Buscar por nmero de parte, marca o descripcin..."` — le faltan las tildes: **número** y **descripción**.

### B. Búsqueda Persistente Incontrolable
Cuando el usuario busca "3/8", el filtro de texto se queda enclavado y **no se limpia al cambiar de categoría**. Tampoco hay una forma clara de quitar ese filtro si no borras manualmente el texto de la barra.

### C. Sin Filtros en la Sección "Todas"
Cuando la categoría activa es "Todas" (`categoriaActiva === null`), el `FilterSidebar` se oculta completamente. Esto deja al usuario sin la capacidad de filtrar por Marca u otras propiedades cuando navega por todas las categorías a la vez.

### D. Búsqueda No Se Refleja en los Checkboxes
El usuario espera que, al buscar "3/8", el filtro "Diámetro: 3/8" se auto-seleccione como un checkbox, de modo que pueda quitarlo fácilmente con un clic.

---

## 2. Pasos de Implementación

### Paso 1: Corregir Typo en Header.tsx
- **Archivo:** `src/components/layout/Header.tsx` (línea 67)
- **Cambio:** Reemplazar `nmero` → `número` y `descripcin` → `descripción`

### Paso 2: Limpiar Búsqueda al Cambiar de Categoría
- **Archivo:** `src/app/catalogo/page.tsx`
- **Cambio:** En los botones de las categorías (tanto "Todas" como las específicas), agregar `setBusqueda('')` al handler de clic. Así, al presionar "Endmills", el texto de búsqueda anterior desaparece limpiamente.

### Paso 3: Mostrar Filtros en la Sección "Todas"
- **Archivo:** `src/app/catalogo/page.tsx`
- **Cambio:**
  1. Quitar la condición `categoriaActiva &&` que oculta el `FilterSidebar`.
  2. Cuando `categoriaActiva === null`, generar `camposFiltro` dinámicamente extrayendo las claves de especificaciones técnicas únicas de **todos** los productos cargados (ej. Diámetro, Flautas, Material, Recubrimiento, etc.).
  3. Las `opcionesDinamicas` ya se calculan correctamente con filtros cruzados — solo necesitamos que se ejecuten también cuando no hay categoría activa.

### Paso 4: Búsqueda Inteligente → Auto-Seleccionar Filtros
- **Archivo:** `src/app/catalogo/page.tsx`
- **Lógica:**
  1. Cuando el usuario busca "3/8", después de cargar los productos filtrados, el sistema escaneará todas las opciones dinámicas disponibles.
  2. Si encuentra un valor **exacto** que coincida con el texto buscado (ej. `Diámetro = "3/8"`), auto-seleccionará ese checkbox en `filtrosActivos`.
  3. Luego limpiará el texto de `busqueda`, dejando los checkboxes activos como único filtro.
  4. Si el texto **no coincide exactamente** con ningún valor de filtro (ej. buscar un número de parte como "203-001170"), el texto de búsqueda se mantendrá intacto como filtro general.
- **Resultado:** El usuario verá la palomita en "Diámetro: 3/8" y podrá quitarla con un clic.

### Paso 5: Actualizar SearchBar con `initialValue` reactivo
- **Archivo:** `src/components/catalogo/SearchBar.tsx`
- **Cambio:** Asegurarnos de que el componente refleje correctamente cuando `busqueda` cambia externamente (ya sea por limpieza al cambiar categoría o por auto-selección de filtros).

---

## 3. Observación Adicional (Mejora Recomendada)

> [!TIP]
> **Botón "Limpiar Todo" más visible:** Actualmente el botón "Limpiar" del sidebar solo se muestra cuando hay filtros de checkbox activos. Sugiero agregar una **etiqueta visual** debajo de la barra de búsqueda que muestre las búsquedas/filtros activos como "chips" (pastillas removibles), por ejemplo: `[× 3/8] [× GWS]`. Esto le da al usuario control visual total. ¿Quieres que lo incluya en esta implementación?

## 4. Seguridad
- La lógica de precios, carrito y paginación NO se toca.
- Los filtros cruzados existentes siguen funcionando igual; solo expandimos su alcance a la vista "Todas".
- Los `campos_filtro` de cada categoría (definidos en Supabase) se siguen respetando cuando una categoría específica está seleccionada.
