# Plan de Corrección: Problema con la tecla "Coma"

## 1. Análisis del Bug
Has encontrado un bug clásico de interfaces reactivas. Actualmente, cada vez que presionas una tecla en esa caja de texto, el sistema:
1. Divide el texto por comas.
2. Elimina los espacios vacíos.
3. Vuelve a pegar las palabras.

El problema es que cuando escribes `TiAlN, ` (con una coma al final), el sistema lee la coma, ve que a la derecha de la coma "no hay nada escrito todavía", asume que es un espacio vacío y lo borra instantáneamente. Por eso no te deja poner comas.

## 2. Solución Propuesta (Desacoplamiento de Estado)
Voy a separar el "texto crudo" (lo que tú estás escribiendo en tiempo real) de la "lista final" (el arreglo de opciones que guarda la base de datos). 

**Paso a paso:**
1. Modificaré el código del modal para que la caja de texto guarde exactamente cada carácter que escribas (incluyendo comas y espacios muertos) sin intentar filtrarlo en cada teclazo.
2. La transformación (cortar por comas y limpiar los textos) se hará **exclusivamente al momento de darle clic a "Guardar Configuración"**.
3. Mantendré la previsualización de etiquetas azules debajo de la caja, la cual se irá actualizando en vivo a medida que agregues comas, pero sin borrarte lo que estás escribiendo arriba.

> [!TIP]
> **Sin afectaciones:** Esto es un ajuste estrictamente de comportamiento de la interfaz de usuario. No requiere cambios en la base de datos ni afecta las consultas o los catálogos ya creados.

¿Me das luz verde para aplicar este parche rápido?
