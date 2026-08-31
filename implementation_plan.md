# Plan de Implementación: Dirección en el Correo Electrónico

## Problema Identificado
Revisé la estructura de los correos automáticos. Resulta que la "plantilla visual" que genera el correo (el código HTML) fue diseñada originalmente para mostrar solo 4 datos del cliente (Nombre, Empresa, Email y Teléfono). Aunque nuestra API ya le está mandando el Código Postal, la Ciudad y el Estado (juntos en la variable `direccion`), la plantilla del correo simplemente **no la está imprimiendo** en la pantalla.

## La Solución Propuesta
1. **Actualizar el Molde del Correo:** Abriré el archivo maestro de notificaciones (`src/lib/email/notifications.ts`).
2. **Inyectar la Dirección:** Le agregaré un nuevo renglón a la caja de "Datos del Cliente" que diga **"Envío a:"** seguido de la información del domicilio.
3. **Protección:** Le pondré un condicional inteligente. Si por alguna razón un cliente viejo pide una cotización que no tenga dirección (las cotizaciones rápidas donde solo bajó el PDF), el renglón simplemente se ocultará para no mostrar espacios en blanco ni errores.

Al hacer esto, el equipo de ventas finalmente verá el renglón:
`Envío a: CP: 31124, Guadalajara, Jalisco` directamente en el correo.

---
> [!IMPORTANT]
> **Aprobación:** Este cambio solo requiere inyectar una línea HTML en la plantilla del correo, sin afectar bases de datos ni el flujo que ya funciona. ¿Me confirmas que proceda a inyectar el campo de dirección en la plantilla del correo?
