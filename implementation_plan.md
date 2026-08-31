# Plan de Correcciones y Mejoras (Cotizador)

Este documento detalla las causas de los tres problemas reportados y la lógica exacta de cómo se van a solucionar. Por favor revisa y aprueba este plan antes de que proceda a escribir el código.

## 1. El Flujo de los Botones (UI)
**El Problema:** Actualmente, al llenarse el formulario de "Descargar PDF", el PDF sí se descarga, pero la interfaz muestra los DOS botones (PDF y Formal). Tú solicitaste que después de que el usuario ya tenga el PDF, la página debe enfocarse en vender y mostrar SOLO el botón verde de "Solicitar Cotización Formal".
**La Solución:** 
- Cambiaré la lógica de la pantalla. Si el cliente ya está autenticado (es decir, ya pasó el primer filtro), el botón principal gigante de "Descargar PDF" **desaparecerá**.
- En su lugar, el único botón principal será el verde ("Solicitar Cotización Formal").
- *Sugerencia UX (Opcional pero muy recomendada):* Colocaré un enlace pequeño de texto muy discreto debajo del botón verde que diga *"Volver a descargar mi PDF"*, por si el cliente cierra el archivo sin querer y necesita volver a bajarlo sin recargar la página.

## 2. El Envío del Correo (Falla Silenciosa)
**El Problema:** El correo de prueba funcionaba perfecto, pero dejó de llegar. Esto no es culpa de los datos, sino de la arquitectura de Vercel. En el código actual le dije a Vercel: *"Envía el correo en segundo plano y responde rápido al cliente"*. El problema es que Vercel "congela" los servidores en el milisegundo exacto en que le responde al cliente, matando el proceso de envío de correo antes de que salga a internet.
**La Solución:** 
- Modificar el archivo `/api/cotizaciones/route.ts` para obligar al servidor a **esperar** a que el correo sea recibido exitosamente por Resend antes de devolverle el éxito al cliente. (Esto agregará 1 o 2 segundos a la animación de "Cargando..." del botón verde, pero garantiza 100% que el correo se mande).

## 3. Formulario de Dirección Detallado
**El Problema:** Se requiere una captura de dirección más exacta (Calle, Colonia, Números, Referencias) para paqueterías, en lugar de un solo cuadro de texto.
**La Solución:** 
- Rediseñaré el `AddressForm.tsx` con campos separados y organizados:
  - Código Postal
  - Colonia o Delegación
  - Calle
  - Número Exterior
  - Número Interior (Opcional)
  - Entre Calles (o colindancias)
  - Especificaciones / Indicaciones extra (Cuadro de texto más grande)
- **Estrategia de Datos:** Para no tener que hacer modificaciones complejas a la base de datos (y arriesgarnos a romper la exportación a Excel que ya funciona), tomaré todos estos campos individuales en el formulario y los "ensamblaré" en un solo texto muy bien formateado justo antes de enviarlos a la base de datos y al correo. Así tendrás todo el detalle exacto sin complicar tu base de datos.

---
> [!IMPORTANT]
> **Aprobación Requerida:** Por favor, indícame si estás de acuerdo con este enfoque (especialmente con la idea de dejar un pequeño enlace de "Volver a descargar PDF" y la estrategia de ensamblado de la dirección) para comenzar a escribir el código de inmediato.
