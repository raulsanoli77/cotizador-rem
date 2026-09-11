# Plan: Módulo de Marcas y Logos

## 1. Almacenamiento (Base de Datos)
- Usaremos la tabla existente de `configuracion` (donde ya guardas los colores y logos) para crear un nuevo registro de `marcas_logos`.
- Esto nos evitará tener que modificar los 20,000 productos. Solo asociaremos el nombre de texto (ej. "GWS") con la imagen correspondiente.

## 2. Panel de Administración (`/admin/marcas`)
- Se creará una nueva pantalla en tu panel de control dedicada exclusivamente a las Marcas.
- Podrás presionar "Agregar Marca", escribir el nombre exactamente como aparece en el catálogo (ej. "GWS") y subir la imagen de su logo.
- El sistema subirá las imágenes al mismo almacenamiento seguro que ya usamos (`media`) y las vinculará automáticamente a todas las herramientas que compartan ese nombre.

## 3. Carrusel de Marcas (Pantalla Principal)
- Justo debajo de la sección "Nuestras Categorías", agregaré una nueva tira visual llamada **"Nuestras Marcas"**.
- Todas las marcas a las que les hayas subido un logo en el administrador aparecerán aquí con un diseño elegante, resaltando la calidad comercial de REM.

## 4. Integración en el Catálogo y Producto
- **Tarjetas de Producto (Grid):** En lugar de que aparezca la "píldora" gris con el nombre de la marca en texto, aparecerá el logo visual de la marca en la esquina superior de la tarjeta (tal como en la imagen de ejemplo que subiste).
- **Detalle de Producto (`/catalogo/[id]`):** Al abrir una broca específica, el logo también se mostrará grande y profesional en la sección de especificaciones técnicas o encabezado de la herramienta.

## 5. Prevención de Errores
- Si un producto pertenece a una marca a la cual aún no le subes su logo, el sistema seguirá mostrando el texto normal (como "OSG") para que nunca quede vacío.
