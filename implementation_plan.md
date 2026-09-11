# Plan: Mostrar Logos de Marcas en el Catálogo

## 1. Problema Actual
Las imágenes de las marcas se ven correctamente en la página de inicio y en la página de detalle de producto. Sin embargo, en la cuadrícula principal del catálogo (`ProductGrid`) todavía aparece el texto original en la esquina superior izquierda. 

El motivo: Aunque el componente de la tarjeta ya está programado para recibir la imagen de la marca, la página principal del catálogo olvidó enviarle el "diccionario" con los logos de la base de datos a esa sección.

## 2. Pasos de Implementación

### A. Estado de Logos en el Catálogo (`page.tsx`)
- Declarar una nueva variable de estado en `src/app/catalogo/page.tsx` para almacenar los logos de las marcas (`marcasLogos`).

### B. Descarga de Datos (Fetch)
- Cuando el catálogo se cargue por primera vez (al mismo tiempo que se descargan las categorías), ejecutar una consulta ligera a la tabla `configuracion`.
- Esta consulta descargará el diccionario de `marcas_logos` que configuraste previamente en el panel de administrador.

### C. Conexión de Datos (Prop Passing)
- Ubicar la línea donde se dibuja la cuadrícula de productos (`<ProductGrid ... />`).
- Inyectar la variable recién descargada: `<ProductGrid productos={...} marcasLogos={marcasLogos} />`.
- De esta manera, cada tarjeta de producto podrá buscar si su marca de texto (ej. "GWS") tiene un logo correspondiente y reemplazarlo visualmente.

## 3. Seguridad
- La carga de los logos se hace una sola vez al entrar al catálogo. No ralentizará la paginación ni los filtros ya que es un pequeño archivo JSON de memoria.
- No afectará la vista si alguna marca no tiene logo asignado.
