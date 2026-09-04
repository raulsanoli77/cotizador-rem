# Plan de Mejora: Filtros en Cascada (Faceted Search)

## 1. Problema Actual
Actualmente, las opciones dinámicas se están extrayendo de **todos los productos de la categoría**, ignorando los filtros que el usuario ya seleccionó. 
*Nota: Si viste que el Zanco se redujo, probablemente fue una coincidencia porque en los 100 productos que trajo la base de datos para esa categoría, solo existía ese zanco.*

## 2. El Reto de los Filtros Dinámicos
Si simplemente extraemos las opciones de los productos ya filtrados (`productosFiltrados`), tendríamos un error de diseño grave: 
Si seleccionas "Diámetro: 1/8", la lista de productos se reduce solo a los de 1/8. Si extraemos las opciones del diámetro de ahí, **desaparecerían las demás opciones (1/4, 3/8)** y ya no podrías cambiar de opinión.

## 3. La Solución Ideal (Estilo Amazon / MercadoLibre)
Implementaremos **Filtros en Cascada cruzados**:
Para calcular qué opciones mostrar en un filtro específico (ej. Flautas), el sistema revisará todos los productos que cumplan con **todos los demás filtros activos** (ej. Diámetro y Marca), pero ignorará el filtro de Flautas. 

De esta manera:
1. Si eliges `Diámetro = 1/8`, el filtro de **Flautas** solo mostrará las flautas que existen para los cortadores de 1/8.
2. El filtro de **Diámetro** seguirá mostrando todas sus opciones (1/8, 1/4, 3/8) para que puedas cambiar de medida libremente.
3. Lo mismo aplicará para la **Marca**: solo mostrará marcas que fabriquen las especificaciones seleccionadas.

## 4. Cambios Técnicos en `src/app/catalogo/page.tsx`
1. Reemplazaremos el bloque que genera `opcionesExtraidas`.
2. Para cada campo dinámico, crearemos un mini-filtro cruzado:
   - Evaluará cada producto contra `filtrosActivos`, **saltándose** la llave actual.
   - Extraerá los valores únicos solo de los productos que pasen esa prueba.
3. Haremos lo mismo para la extracción de `marcasDisponibles`.

> [!TIP]
> **Rendimiento:** Esto se hará del lado del cliente (en memoria) sobre los productos ya descargados, por lo que será instantáneo y no saturará la base de datos.

¿Estás de acuerdo con esta lógica para implementar los filtros en cascada?
