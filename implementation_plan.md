# Plan de Mejora: Catálogo de Administrador

He analizado tu captura y el código actual de la página de administración de productos (`src/app/admin/productos/page.tsx`). Tienes razón, los botones actuales solo dicen "(Próximamente)". 

Aquí está la lista de lo que implementaremos y mis **sugerencias expertas** para dejar esta pantalla operando como un ERP industrial nivel B2B:

## 1. Habilitar Acciones Faltantes
- **Borrar (Trash):** Implementaremos la función para eliminar el registro de Supabase, agregando una alerta de confirmación (para evitar borrados accidentales).
- **Editar (Pencil):** En lugar de hacerte salir de la página, crearemos un Panel Lateral (Slide-over) o Modal donde podrás modificar el costo, nombre, marca y categoría del producto sin perder de vista la tabla.

## 2. Visualización Completa ("Ver toda la información")
- **Botón de Vista Previa (Eye):** Agregaré un botón con un ícono de un Ojo. Al darle clic, abrirá una ventana que te mostrará **absolutamente todos los datos** de ese producto (su descripción original larga, su fotografía y toda la tabla oculta de `especificaciones_tecnicas` que actualmente no cabe en la tabla).

## 3. Buscador y Filtros
- **Barra de Búsqueda (Search Bar):** Una barra superior para buscar instantáneamente por SKU, Marca o Número de Parte.
- **Filtro Rápido:** Pestañas para filtrar rápidamente por estado (Todos / Solo Activos / Solo Inactivos).

## 4. Sugerencias Adicionales (Altamente Recomendadas)
1. **Miniatura de Imagen (Thumbnail):** Sugiero agregar una pequeña columna al principio de la tabla que muestre una foto miniatura de la herramienta. Esto te ayudará visualmente a detectar qué productos aún no tienen foto cargada.
2. **Paginación (Crucial):** Actualmente, si subes 5,000 herramientas, el sistema intentará dibujar las 5,000 filas de golpe y trabará tu navegador. Sugiero implementar paginación (ej. mostrar de 50 en 50) para que tu panel vuele y cargue al instante.

> [!IMPORTANT]
> **Seguridad:** Estos cambios son exclusivos de la vista de Administrador. No afectarán la vista pública de tus clientes ni los cálculos de cotización del carrito.

¿Apruebas este plan para comenzar a codificar los filtros, la paginación, el modal de detalles y arreglar los botones?
