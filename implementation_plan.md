# Plan: Expandir el Buscador a la Descripción y Medidas

## 1. Contexto Actual
Actualmente, el buscador en `/admin/productos` solo revisa 3 campos:
- SKU Interno
- Número de Parte
- Marca

La "Descripción" que ves en la tabla ("CORTADOR 1/64 4FL CARBURO...") no es un texto simple en la base de datos, sino que **se construye dinámicamente** uniendo las medidas, el material, el recubrimiento y el tipo (usando la función `formatearDescripcionProducto`).

## 2. Cambios a Realizar

### A. Lógica de Filtrado (`src/app/admin/productos/page.tsx`)
- Modificaremos la constante `matchBusqueda` (que decide si un producto aparece o no al buscar).
- Por cada producto, le pediremos al sistema que genere su descripción dinámica en texto y revise si tu búsqueda coincide con cualquier palabra dentro de ella (ej. "1/64", "TIN", "CARBURO").
- Se sumará a la búsqueda actual, por lo que podrás seguir buscando por SKU o Marca sin problema.

### B. Mejora Visual (Buscador)
- Actualizaremos el texto de fondo (placeholder) de la barra de búsqueda.
- Pasará de: `"Buscar por SKU, Marca o No. Parte..."`
- A: `"Buscar por SKU, Medida, Recubrimiento, Marca..."` para que cualquier administrador sepa que el buscador ahora es "inteligente".

## 3. Seguridad
- **Cero Riesgos en BD:** Este cambio ocurre 100% en la memoria de la página al filtrar la tabla visible. No toca funciones de borrado, no edita registros en Supabase ni rompe la paginación.
- **Rendimiento:** La función de formateo es muy ligera, por lo que buscar entre miles de productos seguirá siendo instantáneo.
