# Análisis y Plan de Optimización de Categorías (Endmills)

He revisado exhaustivamente la plantilla `GWS MEDIDAS ENDMILLS.xlsx` y la forma en que actualmente el sistema guarda y gestiona las especificaciones. Estoy 100% de acuerdo con tu visión: el sistema actual es demasiado burocrático al pedir unidades por cada campo y forzar listas desplegables.

Aquí tienes mis comentarios y la propuesta de plan de trabajo.

## 1. Comentarios del Análisis

1. **Unidad de Medida Global (¡Gran acierto!):** 
   En el Excel tienes una sola columna global `UNIDAD DE MEDIDA` (IN). Actualmente, el panel de administración te hace configurar y luego seleccionar "in / mm" *campo por campo* (Zanco, Diámetro, Corte, etc.). Esto es redundante, lento y propenso a errores. Si la herramienta es imperial, todas sus cotas lo son.
2. **Listas Desplegables Obsoletas para Cotas:**
   Tener un menú desplegable para el "Diámetro" es inútil cuando tienes fracciones infinitas (`1/64`, `3/64`, `1-1/2`). El texto libre es superior, mucho más rápido de capturar a mano, y es **el único método compatible** con una futura importación masiva de tu Excel.
3. **Manejo de Símbolos Especiales:**
   En columnas como `ANGULO DE FLAUTA`, tienes valores numéricos (`30`). El requerimiento de poder definir un símbolo (como `°`) es vital para que la tienda pública se vea profesional (mostrando `30°`), pero sin complicar la captura.
4. **Impacto en el Sistema:**
   Actualmente el catálogo (filtros y tarjetas de producto) lee un bloque JSON de la base de datos (`especificaciones_tecnicas`). La gran ventaja es que **si guardamos el texto ya procesado** (ej. `"30°"` o `"1/4"`), el catálogo público funcionará mágicamente sin tener que reprogramar los filtros ni las vistas. Toda la optimización ocurrirá en el Panel de Administración.

---

## 2. Plan de Trabajo Propuesto

No realizaré ningún cambio hasta que me des luz verde. Este es el plan escalonado para no romper nada existente:

### Fase A: Limpieza del Creador de Categorías (Admin)
- **Modificar:** `src/app/admin/categorias/page.tsx`
- **Cambios:**
  - Eliminaré la opción de configurar "Unidad Múltiple" (in/mm) por cada campo.
  - Agregaré un campo llamado **"Símbolo / Sufijo Opcional"**. Aquí podrás poner `°`, `%`, etc.
  - Dejaré el "Texto Libre" como el estándar predeterminado para crear campos, relegando las listas desplegables a un uso mínimo (solo si alguna vez lo necesitas para algo como "SI/NO").

### Fase B: Simplificación del Formulario de Producto (Admin)
- **Modificar:** `src/app/admin/productos/nuevo/page.tsx` y la vista de edición.
- **Cambios:**
  - Al capturar un producto, desaparecerán los estorbosos selectores de unidad individuales. 
  - Habrá un único selector global "Unidad de Medida Base" para el producto.
  - Si en la categoría le pusiste el símbolo `°` al Ángulo, el formulario mostrará una cajita de texto con el `°` pegado al final. 
  - Al dar "Guardar", el sistema concatenará inteligentemente el símbolo (`30` + `°` = `"30°"`) y lo guardará en la base de datos. ¡La tienda lo leerá perfecto!

### Fase C: Preparación para Importación Masiva (Próximo paso lógico)
- Al hacer que las especificaciones sean puro Texto, la estructura de base de datos quedará **100% compatible** con tu archivo Excel. Cuando decidas que hagamos el importador automático, el script podrá leer la columna `DIAMETRO (D1)` de tu Excel y meterla directo a la base de datos sin fricción.

## ¿Qué sigue?
Revisa este análisis. Si el enfoque técnico te hace sentido y estás de acuerdo con eliminar la burocracia de las unidades campo por campo, dime **"Adelante"** y comenzaré a ejecutar la **Fase A y B**.
