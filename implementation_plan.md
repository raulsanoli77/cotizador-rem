# Plan: Corrección de Búsqueda Global y Descripción

## 1. Problema Actual
- La barra de búsqueda superior (Header) te expulsa al catálogo apenas haces clic, borrando lo que ibas a escribir.
- Al llegar al catálogo, el buscador local solo revisa Número de Parte y Marca, pero ignora la Descripción (Especificaciones Técnicas).

## 2. Pasos de Implementación

### A. Reparar la Barra Superior (`Header.tsx`)
- Cambiaremos el `input` por un `<form>`.
- Ahora te permitirá escribir libremente desde cualquier página (Inicio, Checkout, etc.).
- Al presionar *Enter*, te llevará al catálogo inyectando tu búsqueda en la URL (ej. `/catalogo?q=1/64`).

### B. Inicializar Búsqueda en el Catálogo (`SearchBar.tsx` y `page.tsx`)
- Leeremos el parámetro `?q=` de la URL en cuanto cargue la página del catálogo.
- La barra local de búsqueda tomará ese texto automáticamente para que no tengas que escribirlo dos veces.

### C. Expandir el Filtro a Descripción (Búsqueda Inteligente)
- Tal como lo hicimos en el panel de Administración, implementaremos una capa de filtrado adicional en la página del Catálogo.
- Cuando escribas un término (ej. "TIN" o "1/64"), el sistema no solo buscará en la base de datos por `numero_parte`, sino que iterará sobre todos los resultados disponibles para buscar coincidencias dentro de la **Descripción generada dinámicamente** (la cual contiene el material, recubrimiento, serie, flautas, etc.).

## 3. Seguridad
- No afectaremos la paginación ni los filtros laterales (categorías/marcas). Ambos sistemas trabajarán en armonía con la nueva búsqueda profunda.
