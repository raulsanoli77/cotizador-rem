# Plan de Actualización: Motor de Precios Simplificado

## Mi Opinión Comercial
Me parece una decisión estratégica excelente. 
1. **Reducir el factor de 1.5 a 1.4** significa pasar de un incremento del 50% a uno del 40%. Seguirás cobrando el 15% extra por flete/importación, pero tu precio final será más agresivo y competitivo en el mercado, lo cual es ideal para ganar volumen de ventas.
2. **Forzar ventas en MXN (Reglas 1 y 2):** Simplificar todo a Pesos Mexicanos agiliza la toma de decisiones para la mayoría de los clientes nacionales. Ya no habrá confusión con cotizaciones duales en esta fase del proyecto.

## Cambios Técnicos Propuestos (`src/lib/pricing/engine.ts`)

**1. Ajuste de Parámetros (Factores):**
- Modificaremos la constante `MARGEN_USA` de `1.5` a `1.4`.

**2. Simplificación del Motor Lógico:**
- Interceptaremos la función `determinarFormula`. 
- Le diremos al sistema: *"Ignora cualquier intento de vender en dólares por ahora. Si el proveedor nos vende en USD, cobra en Pesos (Fórmula 1). Si el proveedor nos vende en MXN, cobra en Pesos (Fórmula 2)."*
- Las Fórmulas 3 y 4 se quedarán guardadas (comentadas o desactivadas) por si en un futuro decides reabrir cotizaciones en dólares para maquiladoras extranjeras.

> [!IMPORTANT]
> **Sin afectaciones colaterales:** Este cambio es 100% interno en las matemáticas. La tienda, el carrito, el PDF y el envío de correos seguirán funcionando exactamente igual, simplemente empezarán a mostrar los precios ligeramente más baratos (por el 1.4) y siempre estandarizados en Pesos (MXN).

¿Te parece bien el plan? Si apruebas, aplico la modificación a la fórmula de inmediato.
