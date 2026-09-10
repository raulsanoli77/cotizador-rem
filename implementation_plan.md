# Plan: Rediseño a Página Completa de E-commerce (Estilo Industrial)

## 1. Problema Actual
Actualmente, aunque es una página nueva, el diseño encierra toda la información en una "caja" con esquinas redondeadas que la hace ver como un Pop-up gigante pegado en medio de la pantalla. 

## 2. Nueva Estructura (Inspirada en Berkshire, con ADN de REM)
Vamos a "romper" esa caja y usar todo el ancho de la pantalla como una tienda profesional, dividiendo la página en dos grandes secciones:

### A. Sección Superior: Fotografía e Información (2 Columnas)
- **Fondo:** Blanco/Claro en toda la pantalla.
- **Columna Izquierda (Imagen):** La imagen del producto será enorme y limpia, sin estar encerrada en cajas apretadas.
- **Columna Derecha (Datos):** 
  - Las "migas de pan" (Catálogo > Categoría > Marca).
  - Título (Número de parte) en letras gigantes y oscuras para máxima legibilidad.
  - La descripción completa.
  - **Módulo de Compra (El toque oscuro):** Para mantener la elegancia de los colores que te gustaron, **solo la caja del precio y el botón de agregar al carrito** estarán en un panel oscuro (`bg-slate-900`). Esto creará un contraste hermoso y guiará la vista directo a la compra.

### B. Sección Inferior: Especificaciones Técnicas a Ancho Completo
- En lugar de apretar las especificaciones a la derecha, las bajaremos.
- Ocuparán todo el ancho de la página en una cuadrícula o tabla limpia (inspirada en la tabla inferior de Berkshire).
- Mantendremos detalles en color "teal" (tu verde/azul institucional) y azul oscuro para los títulos de las especificaciones.

## 3. Seguridad
Este cambio es puramente visual (HTML/Tailwind CSS). La lógica de carrito, extracción de base de datos y precios por tipo de cambio queda intacta.
