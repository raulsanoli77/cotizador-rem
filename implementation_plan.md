# Plan de Acción: Casilla de UNIDAD Dinámica (Actualizado)

## 1. Comprendiendo tu solicitud
Quieres que la unidad ya no sea siempre una simple etiqueta. Quieres poder elegir si la unidad será un "Texto Fijo" (ej. solo `mm`), si estará "Vacía" (para campos como Recubrimiento que no llevan unidad), **o** si será una "Lista Desplegable" para que al crear un producto el usuario pueda elegir (ej. `mm, in, N/A`).

## 2. El Impacto en la Estructura de Datos
Si convertimos la unidad en una lista seleccionable por producto, la estructura en la que se guardan los datos cambia.
- **Actualmente se guarda así:** `{"Diámetro": "12"}` *(El sistema asume la unidad global de la categoría).*
- **Con el nuevo cambio se guardará así:** `{"Diámetro": "12", "Unidad_Diámetro": "in"}` *(Porque ahora cada producto puede tener una unidad distinta, o incluso "N/A").*

## 3. Plan de Implementación (Paso a Paso)

1. **Gestor de Categorías:** 
   Debajo de "UNIDAD" existirá un selector llamado: **"Tipo de Unidad: Fija/Nula | Lista Desplegable"**.
   - Si eliges *Fija/Nula*, funciona como ahora (puedes dejarlo en blanco para Material/Recubrimiento, o escribir `mm`).
   - Si eliges *Lista Desplegable*, aparecerá un cuadro para que escribas las opciones separadas por coma. **Aquí podrás escribir exactamente `mm, in, N/A`**, dándote control total sobre lo que aparece en la lista.

2. **Formulario de Nuevo Producto y Edición:** 
   Modificaré los formularios para que, si detectan que la unidad es una lista, coloquen un pequeño menú desplegable integrado directamente al lado de la caja de texto del valor.

3. **Carga Masiva (Excel):** 
   Actualizaré el motor del Excel. Si configuras una unidad como lista, la plantilla generará automáticamente una columna extra (ej. `Unidad_Diámetro`) para que puedas definir desde el Excel si el diámetro va en `mm`, `in` o `N/A`.

4. **Detalles del Producto (El Ojo):**
   Ajustaré la vista del catálogo para que el sistema sepa leer la unidad elegida y la muestre correctamente junto al valor.

> [!IMPORTANT]
> **Compatibilidad:** Este cambio asegura que los campos que no requieran unidad sigan funcionando perfectamente sin estorbar, mientras que los que sí requieren flexibilidad tendrán su selector.

¿Autorizas que proceda con estas modificaciones en cadena?
