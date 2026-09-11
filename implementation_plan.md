# Plan: Rediseño de Página de Producto Individual

## 1. Problema Actual
La vista del producto ocupa demasiado espacio vertical en blanco, cansa la vista, y carece de la navegación principal de la tienda (encabezado con buscador y pie de página). Además, al hacer clic en un producto se pierde la búsqueda actual en el catálogo porque se abre en la misma pestaña.

## 2. Pasos de Implementación

### A. Apertura en Nueva Pestaña (Conservar Catálogo)
- En el `ProductCard.tsx` (las tarjetas del catálogo), modificaré el enlace del producto agregándole el comportamiento `target="_blank"`. Esto asegurará que, al dar clic en una herramienta, ésta se abra en una pestaña nueva, preservando tus filtros y búsqueda exactos en la pestaña original.

### B. Restauración de Encabezado y Pie de Página
- Modificaré el archivo `src/app/catalogo/[id]/page.tsx` para importar y colocar el `<Header />` en la parte superior y el `<Footer />` en la parte inferior. De este modo, la barra negra con el logo y la barra de búsqueda siempre te acompañarán.

### C. Rediseño del Espacio y Colores (Modo Oscuro Industrial)
Para evitar el fondo excesivamente blanco y cansar la vista:
- **Parte Superior (Título y Compra):** Tendrá un fondo oscuro (`bg-slate-900` / azul marino oscuro) con acentos verdes. Esto relajará la vista y pondrá el enfoque absoluto en la herramienta y su cotización.
- **Imagen:** La imagen se mantendrá en un "escenario" blanco a la izquierda para garantizar el contraste de la herramienta, pero enmarcado en el diseño oscuro.
- **Disposición Más Compacta:** Reduciré el `padding` excesivo para que la imagen, el título, el precio y el botón de agregar al carrito sean visibles en la primera pantalla sin necesidad de hacer mucho *scroll*.
- **Parte Inferior (Especificaciones):** Mantendré tu preferencia de conservar los pequeños recuadros individuales (cajitas blancas/grises) para la información técnica (Diámetro, Flautas, Material, etc.), ya que se leen excelente. Estos vivirán en una sección inferior con un fondo `bg-slate-50` (un gris-azulado muy tenue).

## 3. Seguridad
- Las funciones de cálculo de precio, agregar al carrito y selección de cantidad se mantendrán intactas. Solo estamos alterando la "capa de pintura" (CSS/Tailwind) y la inyección de componentes globales.
