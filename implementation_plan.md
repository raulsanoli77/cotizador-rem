# Plan: Borrado Masivo en Catálogo (Admin)

## 1. Objetivo
Permitir la eliminación masiva de productos en el catálogo de administrador (`/admin/productos`), permitiendo que el usuario filtre (por ejemplo, busque "GWS" o seleccione los "Inactivos") y elimine rápidamente solo esa selección.

## 2. Modificaciones Técnicas (Sin afectar funciones actuales)

### A. Archivo de Servidor (`src/app/admin/productos/actions.ts`)
- Agregaremos una nueva función de servidor `bulkDeleteProductosServer(ids: string[])` que use `supabase` con permisos de administrador para ejecutar un borrado rápido por bloque: `.delete().in('id', ids)`.
- Esto no rompe la lógica de creación, edición o la eliminación individual.

### B. Interfaz del Catálogo (`src/app/admin/productos/page.tsx`)
1. **Estado de Selección:** Añadiremos `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())` para llevar la cuenta de qué productos tienen la casilla de verificación (checkbox) activada.
2. **Reinicio por Seguridad:** Si cambias lo que estás buscando en la barra de texto o cambias el filtro de estado ("Activos" a "Inactivos"), limpiaremos las selecciones para evitar que borres por accidente algo que ya no estás viendo en pantalla.
3. **Casillas en la Tabla:** 
   - Una casilla "Maestra" en el encabezado (titulos) que seleccionará todos los productos *actualmente filtrados* (`filtrados`).
   - Una casilla individual por cada fila.
4. **Botón de Acción:** Aparecerá un botón dinámico rojo (ej. "🗑 Eliminar X Seleccionados") al lado del botón de "Importar Excel" únicamente cuando tengas 1 o más productos seleccionados.
5. **Confirmación:** Al presionar el botón de eliminar, saldrá un aviso nativo "¿Estás seguro de eliminar X productos de forma permanente?". Tras confirmar, se borrarán y la tabla se recargará automáticamente.
