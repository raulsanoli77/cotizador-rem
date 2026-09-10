# Plan: Convertir Modal de Producto en Página Completa

## 1. Objetivo
Tomar el diseño híbrido (oscuro/claro) que actualmente vive en una "ventana emergente" (Modal) y convertirlo en una página dedicada completa (`/catalogo/[id]`). Esto mejorará la experiencia de usuario (se puede compartir el link de un producto) y mantendrá la estética premium que te gustó.

## 2. Pasos de Implementación

### A. Crear la Nueva Página Dinámica (`src/app/catalogo/[id]/page.tsx`)
- Se creará una nueva ruta en Next.js.
- Se trasladará *exactamente* el mismo diseño (colores, distribución, tipografías) del Modal a esta página.
- **Ajustes:** En lugar de ser una ventanita flotante con un fondo oscuro borroso y una tachita (X) para cerrar, será un contenedor amplio centrado en la página.
- Incluirá el botón para agregar al carrito, selectores de cantidad y tabla de especificaciones.

### B. Modificar las Tarjetas del Catálogo (`ProductCard.tsx`)
- Se eliminará la lógica del Modal (`isOpen`, `setIsOpen`).
- Las imágenes y los nombres de los productos dejarán de ser simples "botones que abren modales" y se convertirán en enlaces (`<Link>`) que navegarán directamente a la página del producto.

### C. Limpieza
- Una vez implementado, se eliminará el archivo viejo `ProductModal.tsx` para no dejar "basura" en el código.

## 3. Seguridad y Ventajas
- **Compartir Links:** Al tener su propia URL (`/catalogo/12345`), ahora podrás enviarle a un cliente directamente la liga de un producto en específico.
- **Sin afectar funcionalidad:** Toda la lógica de extracción de base de datos y agregar al carrito se mantendrá intacta.
