# Plan: Catálogo de Categorías con Subida desde Admin

## 1. Ajustes Solicitados
- **Diseño en Inicio:** Mostrar exactamente **2 filas de 4 columnas** (8 categorías visibles en total) en pantallas grandes, con botón "Ver más" para el resto.
- **Gestión de Imágenes:** Además del respaldo automático por nombre, se requiere **poder subir y cambiar la imagen desde el panel de Administración** (Sección Categorías).

## 2. Estrategia Segura (Sin afectar funciones externas)

### Fase A: Base de Datos (Supabase)
Como actualmente la tabla `categorias` no soporta imágenes, necesitamos agregarle esa columna.
- **Acción:** Ejecutar un comando SQL sencillo para agregar la columna `imagen_url` a la tabla `categorias`. *(Te daré el comando para que lo pegues en tu panel de Supabase).*

### Fase B: Panel de Administración (`/admin/categorias`)
Se modificará el modal de "Nueva Categoría" y "Editar Categoría" para integrar la subida de imagen.
- **Flujo:** Al seleccionar una imagen, el sistema la subirá al *bucket* `media` (que ya tienes configurado en Supabase) y guardará la URL pública en el campo `imagen_url` de la categoría.
- **Precaución:** Se respetará por completo la lógica actual de "Campos Técnicos/Dinámicos" para no afectar la carga masiva ni los filtros.

### Fase C: Página de Inicio y Componente (`CategoryShowcase`)
- **Grid:** Usaremos `grid-cols-2 md:grid-cols-4` para garantizar que se vean 4 elementos por fila (2 filas = 8).
- **Lógica de Imágenes (El mejor de los mundos):**
  1. Si subiste una imagen desde el Admin (`imagen_url`), mostrará esa.
  2. Si no has subido nada, buscará en automático (`/categorias/[nombre].png`).
  3. Si tampoco existe, mostrará un ícono elegante temporal.
- **Botón "Ver más":** Controlará si se muestran solo las primeras 8 o todas las categorías de la base de datos.
