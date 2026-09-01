# Plan de Rediseño UI/UX (B2B Alineado a REM Industrial)

Después de analizar el sitio web principal (`remindustrial.mx`), queda claro que la identidad visual de la empresa transmite solidez, profesionalismo e ingeniería. El cotizador debe sentirse como una extensión natural de alto nivel tecnológico de este sitio.

## 🛠️ Plan de Ejecución (100% Estético, 0% Riesgo Lógico)

### 1. Paleta de Colores (Coherencia REM Industrial)
- **Fondo General:** Cambiaremos el fondo a `bg-slate-50` (un gris-blanco técnico) para descansar la vista en sesiones largas.
- **Color de Acento (Acción):** Seguiremos usando la clase dinámica `bg-brand-600`. Como vimos, esta clase hereda los colores corporativos directamente de tu base de datos, garantizando que el "verde/teal/azul" exacto de REM Industrial se mantenga vivo en los botones de "Agregar" y "Cotizar".
- **Color Industrial (Estructura):** Usaremos un tono acero oscuro (`bg-slate-900`) para las cabeceras (Header) y el panel de filtros, dándole ese peso visual de plataforma B2B premium (estilo MSC Industrial).

### 2. Tipografía y Escaneo Rápido
- Los títulos y subtítulos usarán `text-slate-900`.
- **Regla de SKUs:** Todos los Números de Parte aplicarán una tipografía especial (`font-mono font-bold text-brand-700`). Esto es vital en el sector industrial para que el ojo de los ingenieros detecte códigos al instante.

### 3. Rediseño del Catálogo (Alta Densidad - List View)
- Abandonaremos el formato de "Tarjetas de Tienda de Ropa" (`grid`).
- Crearemos filas de **Alta Densidad** para los productos. Cada fila mostrará ordenadamente:
  `[Miniatura] ➔ [Marca + SKU Destacado] ➔ [Descripción Técnica Industrial] ➔ [Precio] ➔ [Botón Agregar]`
- **Filtros Sticky:** El panel lateral izquierdo de filtros tendrá bordes limpios, checkboxes cuadrados técnicos y se quedará "pegado" (`sticky`) al bajar por la lista de productos.

### 4. Mini Carrito Lateral (Slide-over Drawer)
- En lugar de destrozar y mover tu página actual de `/cotizacion` (que tiene muchísima lógica importante como la creación del PDF, los correos, y la captura de datos de envío), crearemos un panel lateral rápido.
- Al dar clic al carrito, este se deslizará desde la derecha mostrando los productos y el subtotal.
- Tendrá un botón dominante que dirá *"Proceder a Cotización Formal"*, el cual llevará al usuario seguro a la pantalla que ya tenemos configurada. Esto mejora el UX sin poner en riesgo la lógica de la aplicación.

### 5. Portal de "Checkout" (Gatekeeper)
- Los formularios para dejar el correo y pedir el flete (CP, Estado, Ciudad) dejarán de verse como simples páginas web y pasarán a verse como **Tarjetas de Seguridad Corporativa**: fondos limpios (`bg-white`), sombras marcadas (`shadow-md`), y bordes muy finos en las cajas de texto (`border-slate-300` con `focus:ring-brand-500`).

---

> [!IMPORTANT]  
> **Aprobación Final:** Garantizo que mi trabajo será única y exclusivamente sobre los atributos `className` de Tailwind CSS y la estructura visual HTML. **Ninguna función, base de datos, flujo de correos o creación de PDFs será alterada.** ¿Me das autorización para comenzar a escribir el nuevo diseño de REM Industrial?
