# Plan: Refinamiento de Tarjetas y Cuadrícula

## 1. Problema Actual (Análisis de Capturas)
- **Columnas:** Al permitir 6 columnas, las tarjetas se vuelven demasiado angostas.
- **Imagen:** La proporción `4:3` recortó demasiado el alto, haciendo que las herramientas largas (endmills) se vean minúsculas.
- **Elementos cortados:** El botón "Agregar" y el selector de cantidad están peleando por espacio horizontal, causando que el texto se corte ("Agre...").
- **Tipografía:** El precio y el título son demasiado grandes para el ancho actual de la tarjeta.

## 2. Solución Propuesta (Pasos de Implementación)

### Paso 1: Fijar a 5 Columnas Máximo
- **Archivo:** `src/components/catalogo/ProductGrid.tsx`
- **Cambio:** Eliminar `2xl:grid-cols-6`. La cuadrícula será: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
- **Beneficio:** Las tarjetas serán más anchas, dándole espacio a los botones para respirar.

### Paso 2: Aumentar la Imagen (Punto Medio)
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambio:** Cambiar `aspect-[4/3]` a `aspect-[5/4]`.
- **Beneficio:** Es un punto medio perfecto. Es más alto que el 4:3 (las fotos se verán más grandes y claras), pero sigue siendo más compacto que el cuadro 1:1 original. Además, reduciremos el padding interno de `p-6` a `p-4` para que la imagen aproveche todo el borde.

### Paso 3: Rediseño Responsivo de Botones y Textos
- **Archivo:** `src/components/catalogo/ProductCard.tsx`
- **Cambio en Tipografía:**
  - Reducir título de `text-lg sm:text-xl` a `text-base font-bold`.
  - Reducir precio de `text-2xl` a `text-xl`.
- **Cambio en Botones (Crucial):**
  - Reducir el ancho del contador de cantidad de `w-24` a `w-20` (más compacto).
  - Hacer que el botón "Agregar" use `flex-1` (toma el resto del espacio disponible automáticamente), reduciendo su padding horizontal y tamaño de fuente (`text-sm`) para garantizar que la palabra "Agregar" **nunca** se corte.
  - Para pantallas *extremadamente* angostas, usaremos `flex-wrap` para que, si no caben, el botón baje ordenadamente sin romperse.

## 3. Sugerencia Adicional de Diseño

> [!TIP]
> **Ocultar el texto en móviles pequeños:** En pantallas muy chiquitas (celulares en vertical), la palabra "Agregar" suele estorbar. Sugiero que en móviles solo se vea el **ícono del carrito** en el botón, y en tablets/escritorio sí diga "Agregar". ¿Te parece bien implementarlo así para hacerlo 100% a prueba de recortes? Por ahora, aplicaré el auto-ajuste de texto para escritorio como pediste.
