# Plan: Actualización del Eslogan / Descripción de la Empresa

## 1. Problema Actual
El cotizador y los documentos generados utilizan el eslogan:
*"INTEGRADOR TÉCNICO DE HERRAMIENTAS INDUSTRIALES"*

Esta frase ya no refleja la totalidad del catálogo de la empresa (Metrología, MRO, Abrasivos, etc.) y se busca algo más general y representativo de la industria metalmecánica.

## 2. Archivos Detectados
Al buscar en el código, encontré que esta frase exacta se utiliza en 3 lugares clave del sistema de cotizaciones:

1. **`src/app/page.tsx`**: Es el texto principal (Hero) que sale al abrir el cotizador.
2. **`src/components/layout/Footer.tsx`**: Es la descripción que sale en la parte de abajo de todas las pantallas del cotizador.
3. **`src/lib/pdf/quote-template.tsx`**: Es el texto que aparece impreso en los PDFs de las cotizaciones que se le mandan a los clientes.

## 3. Cambios Propuestos
- Sustituir la frase anterior por la nueva frase elegida por el usuario.
- En el caso del PDF, asegurarse de que el texto nuevo quepa correctamente en el diseño de la hoja (si es muy largo, se puede ajustar el tamaño de fuente o dividir en dos líneas).
- En el Landing Page (`page.tsx`), asegurar que el diseño responsivo se mantenga alineado con el texto más largo.

## Pasos a Seguir
1. Esperar a que el usuario confirme cuál de las opciones de redacción prefiere.
2. Aplicar el cambio de texto en los 3 archivos mencionados.
3. Validar el diseño visual.
