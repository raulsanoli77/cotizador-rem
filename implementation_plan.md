# Plan: Optimización de Espacio en Tabla (Evitar Scroll)

## 1. Problema Actual
La tabla en `/admin/productos` tiene forzado un ancho mínimo de 1000 píxeles (`min-w-[1000px]`). En pantallas de laptop, sumando el menú lateral azul, la pantalla se queda sin espacio y obliga a hacer scroll horizontal. 
Adicionalmente, el texto de la "Descripción" puede ser muy largo y empujar las demás columnas hacia afuera.

## 2. Solución (Ajustes de Diseño)

### A. Modificaciones en la Tabla
- **Eliminar el ancho forzado:** Cambiaré `min-w-[1000px]` a `w-full` para que la tabla se vuelva elástica y se adapte al espacio que tienes en pantalla.
- **Reducción de Rellenos (Padding):** Bajaré ligeramente el espacio "en blanco" entre columnas (de `px-4` a `px-2` o `px-3`) para recuperar área útil.
- **Truncado Inteligente de Descripción:** A la columna de Descripción le agregaré la clase `truncate` con un ancho máximo. Si la descripción es larguísima, se cortará con tres puntos suspensivos ("CORTADOR 1/64 4FL..."). Si necesitas leerla completa, igual puedes usar el botón del 'Ojito' (Ver detalles).

### B. Modificación en Acciones
- **Apretar botones:** Los 3 botones de la derecha (Ver, Editar, Eliminar) tendrán un espacio interno ligeramente menor para que la columna de "Acciones" ocupe menos porcentaje de la pantalla.

## 3. Seguridad
Estos cambios son 100% estéticos (clases de Tailwind CSS). No afectan ni un solo proceso de bases de datos, borrado, ni filtrado.
