# Plan: Paginación de Productos (50 por página)

## 1. El Problema Actual
Actualmente, el sistema descarga y renderiza todos los productos de una categoría (hasta 500) en una sola lista continua. Aunque es funcional, renderizar tantos componentes visuales al mismo tiempo puede alentar el navegador (DOM overload) y hace que la página sea infinitamente larga.

## 2. El Reto de los Filtros Dinámicos (Muy Importante)
No podemos simplemente decirle a la base de datos "dame solo 50" (Paginación de Servidor). Si hacemos eso, la barra lateral de filtros **se rompería**. 
*Ejemplo:* Si filtramos "Endmills" y solo pedimos 50 a la base de datos, el menú de filtros solo mostrará los diámetros que existan en esos primeros 50. Si hay un diámetro de 3/4" en la página 2, el usuario no podría filtrarlo porque el sistema no sabría que existe.

## 3. La Solución Óptima: Paginación en Cliente (Client-side Pagination)
Para conservar la velocidad instantánea de los filtros y asegurar que no falten opciones, implementaremos este flujo:

1. **Mantener la consulta general:** Seguiremos trayendo el bloque de productos (ej. 500) de la base de datos.
2. **Filtrado cruzado intacto:** El sistema aplicará los filtros que el usuario elija sobre todos esos productos, calculando un total (ej. 150 productos coinciden).
3. **Paginación en memoria:** Crearemos un nuevo estado `paginaActual`. Solo le pasaremos al motor visual (`ProductGrid`) un "corte" de 50 productos a la vez.
4. **Controles de Paginación:** Agregaremos una botonera debajo de los productos con botones de "Anterior", números de página, y "Siguiente".
5. **Reset Automático:** Cada vez que el usuario cambie de categoría, escriba en el buscador, o seleccione un filtro nuevo, la página regresará automáticamente a la "Página 1".

## 4. Cambios en Código
- **`src/app/catalogo/page.tsx`:** 
  - Agregar `const [paginaActual, setPaginaActual] = useState(1);`
  - Cortar el arreglo: `const productosPaginados = productos.slice((paginaActual - 1) * 50, paginaActual * 50);`
  - Mandar `productosPaginados` al `<ProductGrid>`.
  - Crear e inyectar el componente visual de los botones de paginación al final de la lista.
- **Sin afectar a externos:** El componente `ProductGrid` no sabrá que está paginado, solo recibirá 50 items. La lógica del carrito, PDFs y filtros queda 100% intacta.
