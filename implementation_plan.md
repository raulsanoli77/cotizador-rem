# Plan de Mejora: Barra de Filtros del Catálogo

## 1. Problemas Actuales Identificados
- **Sin barra de desplazamiento (Scroll):** Cuando hay muchos filtros, la barra lateral no se puede "scrollear", dejando opciones fuera de la pantalla.
- **Campos de Texto Libre (Ej. Diámetro):** Actualmente son una simple caja de texto donde el usuario tiene que adivinar y escribir.
- **Falta de visibilidad:** El usuario no sabe qué opciones de Diámetro o Zanco existen realmente en los productos cargados.

## 2. Solución Propuesta
Transformaremos la barra de filtros para que se comporte como las de Amazon o MercadoLibre:

### A. Barra Lateral con Scroll
- Le daremos a la barra completa una altura máxima calculada (`max-h-[calc(100vh-80px)]`) y una propiedad `overflow-y-auto`. Esto permitirá hacer scroll dentro de la barra de filtros sin mover toda la página.

### B. Listas Dinámicas Automáticas (Extracción de Opciones)
- En lugar de mostrar un cuadro de texto vacío para escribir el "Diámetro", el sistema leerá todos los productos disponibles en esa categoría y **extraerá los valores únicos** (ej. `1/8`, `1/4`, `3/8`).
- Mostraremos esos valores como una lista seleccionable para que el cliente solo tenga que hacer clic.

### C. Mini-Buscador por Filtro
- Si una categoría tiene 50 diámetros distintos, la lista será muy larga.
- Para solucionar esto, cada filtro tendrá una **pequeña caja de búsqueda interna** en la parte superior de su lista. Si escribes "1/8" ahí, filtrará rápidamente la lista de opciones de diámetro para que lo encuentres al instante.

## 3. Cambios Técnicos (Sin afectar otras funciones)
1. **`src/app/catalogo/page.tsx`**: 
   - Modificaré la función que carga los productos para que no solo extraiga las marcas únicas, sino que también genere un "Diccionario de Opciones Únicas" (`opcionesDinamicas`) a partir de las `especificaciones_tecnicas` de todos los productos descargados de la base de datos.
2. **`src/components/catalogo/FilterSidebar.tsx`**:
   - Ajustaré las clases CSS de Tailwind para habilitar el scroll de la barra principal.
   - Eliminaré el viejo `input` de texto y lo reemplazaré por una lista dinámica que se alimenta del Diccionario creado en el paso 1.
   - Agregaré estados locales de búsqueda (ej. `searchDiámetro`, `searchMarca`) para filtrar la vista interna de las listas.

> [!TIP]
> **Compatibilidad Garantizada:** Esto no tocará el cómo agregas productos desde el panel de administración. El tipo "Texto Libre" del administrador seguirá funcionando igual; simplemente en el catálogo al cliente se le mostrarán pre-agrupados.

¿Te parece bien este flujo? Si estás de acuerdo, lo implemento enseguida.
