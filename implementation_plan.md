# Plan de Corrección: Formato en Correo y Vista Web

He revisado a profundidad el código basándome en tus capturas de pantalla y ya encontré exactamente qué pasó y cómo lo vamos a corregir sin tocar ni romper la lógica de Vercel que ya reparamos.

## 1. Problema del Correo ("Endmills")
**¿Por qué pasó?** 
Cuando la página web recolecta los artículos del carrito para enviárselos a la API y que esta dispare el correo, el sistema estaba empaquetando dos variables:
- `descripcion_tecnica`: CORTADOR 1/8" 4FL CARBURO... (El nuevo formato).
- `descripcion` (normal): Endmills (El nombre crudo).

La plantilla del correo de Resend está programada estructuralmente para leer siempre la variable `descripcion` normal, por lo que ignoró nuestro nuevo texto industrial.
**La Solución:** 
Modificaré el "empaquetador" (`page.tsx`) para que sobrescriba el campo principal `descripcion` con nuestro formato industrial. Al hacer esto, el correo automáticamente imprimirá el texto correcto sin tener que modificar la estructura interna de las notificaciones (minimizando cualquier riesgo de romper el envío).

## 2. Problema visual de "CP" duplicado (Extra detectado en tu captura)
**¿Por qué pasó?**
En tu primera captura, noté que arriba dice: `Envío a: CP: 31124, dsfsd, dsfsd, CP 31124`. 
El código de la página web tenía una instrucción antigua que decía: *Imprime la dirección y luego agrégale ", CP [número]" al final*. Como nuestro nuevo mini-formulario de envío ya guarda el texto completo como `"CP: 31124, Ciudad, Estado"`, la página lo está imprimiendo dos veces.
**La Solución:**
Limpiaré esa línea en la vista web (`page.tsx`) para que solo imprima la dirección limpia una sola vez, quedando perfecta: `Envío a: CP: 31124, dsfsd, dsfsd`.

---
> [!IMPORTANT]
> **Aprobación Requerida:** Todo el mecanismo de creación de PDFs y envío de correos sigue intacto y estable. Estos dos cambios son solo de "etiquetado" de datos y limpieza visual. ¿Me das luz verde para aplicar este plan y dejarlo listo?
