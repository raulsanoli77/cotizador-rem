# Plan de Mejoras: Simplificación de Envío y Estandarización de Nomenclatura

Me alegra mucho que la arquitectura anterior haya funcionado perfectamente. Entiendo totalmente el cambio de enfoque: para cotizar un flete estándar (FedEx/DHL) no necesitamos saturar al cliente pidiendo la calle exacta, basta con saber a qué ciudad y código postal va.

Además, el requerimiento de estandarizar la nomenclatura técnica en los PDFs y Correos es una excelente decisión para darle una imagen mucho más profesional e industrial a las cotizaciones.

Aquí está el plan de acción seguro para aplicar estos cambios sin romper nada de lo que ya funciona:

## 1. Simplificación del Formulario de Envío (`AddressForm.tsx`)
- **Acción:** Retiraré los campos detallados (Calle, Colonia, Números, etc.).
- **Nuevos Campos:** Dejaré únicamente **Código Postal**, **Estado** y **Ciudad** (los tres serán obligatorios).
- **Protección de Base de Datos:** Estos tres datos se ensamblarán internamente como `"CP: [codigo], [Ciudad], [Estado]"` y se guardarán en la misma columna de texto que ya usamos. Así no rompemos el exportador a Excel ni las tablas de la base de datos.

## 2. Estandarización de la Descripción Técnica (PDF y Correo)
- **Acción:** Crearé una función centralizada (un "Formateador") que se encargará de leer las características crudas del producto y transformarlas exactamente al formato que solicitaste.
- **Lógica de Formateo que aplicaré:**
  1. **Categoría:** Si la categoría original es "Endmills", la traducirá a `CORTADOR`.
  2. **Diámetro:** Agregará el símbolo de pulgadas (`"`).
  3. **Filos/Flautas:** Le agregará la terminación `FL` (Ej: `4FL`).
  4. **Material y Recubrimiento:** Se imprimirán tal cual (Ej: `CARBURO ALTIN`).
  5. **Radio:** Si existe, se agregará (Ej: `R .030`). Si el producto no tiene radio, se omitirá limpiamente sin dejar espacios raros.
  6. **Largos:** Al Largo de Corte se le agregará `" CORTE` y al Largo Total `" LARGO`.
  7. **Mayúsculas:** Todo el ensamble final pasará por un filtro `.toUpperCase()` para garantizar que siempre esté en mayúsculas.
  8. **Resultado Esperado:** `CORTADOR 1/8" 4FL CARBURO ALTIN R .030 1/2" CORTE, 1-1/2" LARGO`
- **¿Dónde se aplicará?**
  - Se inyectará en la creación del archivo **PDF** (`PDFDownloadButton.tsx`).
  - Se inyectará en el cuerpo del **Correo Electrónico** que recibe el equipo de ventas.
  - *Sugerencia extra:* También lo inyectaré visualmente en la tabla del **Carrito de Compras** en la página web, para que el cliente vea exactamente la misma descripción profesional antes de descargarla.

---
> [!IMPORTANT]
> **Aprobación Requerida:** Todo el sistema actual está estable. Esta actualización modificará cómo se construyen las descripciones, pero respetará el flujo de base de datos. ¿Estás de acuerdo con la regla de formato para las descripciones? Si es así, procedo a programarlo.
