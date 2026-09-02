# Plan de Modificación: Redondeo Comercial REM (Umbral 0.85)

## Lógica Matemática (Regla REM)
He analizado tus ejemplos y la fórmula matemática exacta que describe tu regla es la siguiente:
Se tomará el número entero del Tipo de Cambio y se evaluarán sus decimales:
- Si los decimales son **menores a 0.85** (ej. `16.849`), se le suma 1 peso al entero (Resultado: `17`).
- Si los decimales son **mayores o iguales a 0.85** (ej. `16.85`, `16.99`, `17.85`), se le suman 2 pesos al entero (Resultado: `18` para los primeros dos, y `19` para el tercero).

## Cambios en el Código (Sin afectar el resto)

**1. Motor de Precios (`src/lib/pricing/engine.ts`):**
- Crearé una nueva función matemática llamada `aplicarRedondeoREM(tc)`.
- Reemplazaré el redondeo tradicional que tiene la Regla 1 por esta nueva función de "súper redondeo" para darte ese gran margen de protección.

**2. Panel de Administración (`src/app/admin/layout.tsx`):**
- Agregaré un "Widget de Moneda" en la esquina inferior izquierda del menú lateral.
- El widget consumirá la API y mostrará dos valores muy claros:
  1. **TC Mercado (API):** El valor real (ej. `$16.99`).
  2. **TC Aplicado (Fórmula):** El valor ya redondeado con tu regla (ej. `$18.00`).

> [!IMPORTANT]  
> **Garantía de Cero Impacto:** Este cambio es exclusivamente matemático. No romperá el carrito, ni la pasarela de PDF, ni el catálogo. Simplemente los precios que ve el cliente se recalcularán obedeciendo tu nueva regla de brincar el peso a partir del `.85`.

¿Autorizas que implemente esta regla matemática y dibuje el Widget en el administrador?
