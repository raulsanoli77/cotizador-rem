# Plan de Rediseño: Homepage y Modal de Producto (Estilo GWS)

Analicé a fondo las capturas de pantalla de GWS Tool Group y el sitio web de REM Industrial. GWS tiene un diseño "Premium B2B" caracterizado por fondos oscuros y dramáticos, tipografías enormes para los números de parte, e iconografía técnica. 

Vamos a fusionar ese nivel de sofisticación de GWS con tu paleta de colores de REM Industrial (Teal/Pizarra).

## Fase 1: Rediseño del Inicio (Homepage "Hero")
**Inspiración GWS:** Impacto visual inmediato, fondos oscuros de ingeniería, llamados a la acción claros.
- **Acción:** Reescribiremos `src/app/page.tsx`.
- **Diseño:** 
  - Eliminaremos el fondo azul básico. Crearemos una sección "Hero" de pantalla completa con un fondo degradado profundo (`slate-900` a `black`), simulando la sofisticación de GWS.
  - Insertaremos el **Logo Grande de REM Industrial** centrado (jalándolo de tu configuración).
  - Un título agresivo y corporativo en blanco puro.
  - Dos botones principales de acción (estilo GWS: "Ver Catálogo Estándar" y "Cotización Rápida"), usando tu color `bg-brand-600`.
  - Las 3 tarjetas informativas de abajo se rediseñarán con un estilo oscuro de alto contraste (Dark Mode style) con bordes sutiles.

## Fase 2: Modal de Detalles del Producto (Quick View)
**Inspiración GWS:** Ficha técnica estructurada. Imagen a la izquierda, SKU gigante, tabla de atributos e íconos de características.
- **Acción:** Crearemos un nuevo componente `ProductModal.tsx`.
- **Diseño del Modal:**
  - Al hacer clic en un artículo del catálogo, no saldremos de la página. Se abrirá una ventana flotante (Modal) amplia y elegante.
  - **Lado Izquierdo:** La imagen de la herramienta sobre un fondo blanco puro (para resaltar el metal, justo como en GWS).
  - **Lado Derecho:** 
    - Breadcrumbs (Ej. Fresado > Cortador).
    - SKU en tipografía **gigante y en negrita**.
    - Precio y control de cantidad con el botón "Agregar a la cotización" (`bg-brand-600`).
  - **Zona Inferior del Modal:** Una cuadrícula (Grid) técnica que iterará sobre todas las `especificaciones_tecnicas` ocultas (Diámetro, Material, Zanco, etc.) mostrándolas en formato de tabla o "cajas de atributos" estilo GWS.
- **Integración:** Actualizaremos la fila del catálogo (`ProductCard.tsx`) para que, al dar clic en la foto o el nombre, se dispare este modal.

---
> [!IMPORTANT]
> **Seguridad Lógica:** 
> 1. El rediseño del inicio (`page.tsx`) es 100% estético, no toca bases de datos.
> 2. El Modal solo "lee" los datos que ya tenemos cargados en la memoria del catálogo, por lo que no hace consultas extra a Supabase ni alenta el sistema. La función de agregar al carrito seguirá usando tu hook seguro de Zustand.
> 
> ¿Apruebas este plan para comenzar la transformación visual?
