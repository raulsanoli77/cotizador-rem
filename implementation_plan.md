# Plan: Cambio de Estado Masivo (Activar/Desactivar)

## 1. Objetivo
Aprovechar el sistema de selección múltiple (casillas) que ya existe para permitir al usuario cambiar el estado de los productos (ponerlos Inactivos o Activos) en bloque, sin tener que ir uno por uno.

## 2. Modificaciones Técnicas (Sin afectar funciones actuales)

### A. Archivo de Servidor (`src/app/admin/productos/actions.ts`)
- Crearemos una nueva acción llamada `bulkUpdateActivoServer(ids: string[], activo: boolean)`.
- Esta función usará el comando `.update({ activo }).in('id', ids)` en la base de datos para cambiar el estado de cientos de productos en una sola petición súper rápida.
- Esto no rompe la lógica actual de actualización individual.

### B. Interfaz del Catálogo (`src/app/admin/productos/page.tsx`)
1. **Lógica de Front-end:**
   - Crearemos la función `handleBulkStatusChange(nuevoEstado: boolean)`.
   - Cuando se ejecute con éxito, actualizaremos el estado visual de la tabla (cambiarán las etiquetas verdes a grises y viceversa) sin necesidad de recargar la página, haciendo que se sienta instantáneo.
   - Después del cambio, se limpiarán las casillas seleccionadas.

2. **Nuevos Botones en la Interfaz:**
   - Aprovechando el espacio donde aparece el botón rojo de "Eliminar", agregaremos **dos botones adicionales** (visibles solo cuando seleccionas 1 o más productos):
     - Botón gris/amarillo: *"Desactivar X"* (Pone `activo: false`)
     - Botón verde: *"Activar X"* (Pone `activo: true`)
   - Se agruparán ordenadamente junto al botón de eliminar para tener un "Panel de Acciones Masivas" limpio.

## 3. Seguridad
- Mantenemos la regla de que al cambiar de pestaña (ej. de 'Todos' a 'Inactivos') o al buscar algo nuevo, las selecciones se limpian solas para evitar cambios en productos ocultos.
