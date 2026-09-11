# Plan: Agregar Filtro de Ordenamiento por Precio

## 1. Problema Actual
El catálogo muestra los resultados basándose únicamente en cómo vienen ordenados de la base de datos (por Marca/Número de parte). No existe forma de ordenar herramientas buscando la opción más barata o la de mayor precio.

## 2. Pasos de Implementación

### A. Gestión de Estado (Memoria)
- Se agregará una nueva variable al componente principal del catálogo: `orden`.
- Valores posibles: `'relevancia'` (por defecto), `'precio_asc'` (menor a mayor), y `'precio_desc'` (mayor a menor).

### B. Modificación de la Barra Superior de la Cuadrícula
- Actualmente, la barra que dice "Mostrando X resultados" desaparece si hay menos de 50 productos.
- La vamos a separar para que **siempre sea visible**.
- Del lado izquierdo dirá el número de resultados (ej. "Mostrando 12 resultados").
- Del lado derecho agregaremos un menú desplegable elegante (Dropdown):
  - "Relevancia"
  - "Precio: Menor a Mayor"
  - "Precio: Mayor a Menor"

### C. Lógica de Ordenamiento
- Dentro del algoritmo que filtra y busca los productos, justo antes de enviarlos a la pantalla, interceptaremos la lista completa.
- Si el usuario selecciona "Menor a Mayor", ejecutaremos una función `.sort()` que comparará el `precio_venta` calculado de cada herramienta y pondrá las baratas al inicio.
- Al cambiar esta opción, automáticamente regresaremos al usuario a la Página 1 para evitar errores de navegación.

## 3. Seguridad
- **Calculo de Precios:** El ordenamiento tomará en cuenta el precio *final* de venta ya procesado (después de conversiones de tipo de cambio USD/MXN y recargos), garantizando que el orden sea matemáticamente exacto para el cliente.
- **Paginación:** No romperá la división de 50 ítems por página.
