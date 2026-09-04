# Plan: Multi-selección y Toggle en Filtros del Catálogo

## 1. Problema Actual
Los filtros actualmente usan **radio buttons** que:
- Solo permiten elegir **una** opción por campo.
- No se pueden desmarcar con clic (el radio button no tiene toggle).

## 2. Cambios Requeridos

### Lógica (OR dentro de un campo, AND entre campos)
Cuando el usuario seleccione múltiples valores en un campo, la lógica debe ser:
- **Dentro de un campo (ej. Flautas):** Un producto pasa si su valor coincide con **cualquiera** de las opciones seleccionadas (`2` **O** `4`). Lógica OR.
- **Entre campos (ej. Diámetro y Flautas):** Un producto pasa si cumple con **todos** los campos activos. Lógica AND.

Ejemplo: Seleccionas Diámetro `1/8` y Flautas `2` y `4`:
→ Muestra los cortadores de 1/8 que tengan 2 flautas, MÁS los cortadores de 1/8 que tengan 4 flautas.

### Tipo del estado de filtros
Actualmente el estado es:
```ts
filtrosActivos: Record<string, string | number | null>
// ej: { Diametro: '1/8', Flautas: '2' }
```
Necesitamos cambiarlo a un array de valores:
```ts
filtrosActivos: Record<string, string[]>
// ej: { Diametro: ['1/8'], Flautas: ['2', '4'] }
```

---

## 3. Archivos a Modificar

### `src/app/catalogo/page.tsx`

#### [MODIFY] Estado `filtrosActivos`
Cambiar el tipo de `string | number | null` a `string[]`.

#### [MODIFY] `handleFiltroChange`
Nueva lógica de toggle:
- Si el valor **ya está en el array** → quitar (toggle off).
- Si el valor **no está** → agregarlo al array.
- Si el array queda vacío → borrar la llave.

#### [MODIFY] `cumpleFiltrosCruzados`
Cambiar la comparación de igual exacto (`===`) a "está en el array" (`array.includes()`). Esto habilita la lógica OR por campo.

#### [MODIFY] Prop `filtrosActivos` pasada a `FilterSidebar`
Actualizar el tipo de la prop.

---

### `src/components/catalogo/FilterSidebar.tsx`

#### [MODIFY] Interface `FilterSidebarProps`
Cambiar el tipo de `filtrosActivos` de `Record<string, string | number | null>` a `Record<string, string[]>`.

#### [MODIFY] `onFiltroChange` signature
Simplificar a `(nombre: string, valor: string) => void` (ya no necesita `null`, el toggle lo maneja el padre).

#### [MODIFY] Cambiar `radio` a `checkbox`
- Reemplazar `<input type="radio">` con `<input type="checkbox">`.
- Actualizar `checked` para revisar si el valor está en el array: `(filtrosActivos[nombre] || []).includes(op)`.

---

## 4. Lo que NO cambia
- Lógica de carga de productos de Supabase.
- Lógica de extracción de opciones dinámicas en cascada.
- Cualquier otra página: admin, checkout, etc.

> [!TIP]
> **Sin impacto:** Solo se modifican `catalogo/page.tsx` y `FilterSidebar.tsx`. Todo el resto del sistema (precios, admin, Excel) queda intacto.
