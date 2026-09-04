# Plan: Ajuste Visual del Descargador de Plantillas

## 1. Problema Actual
En la pantalla de "Carga Masiva", la caja de la derecha ("Instrucciones y Plantillas") tiene un ancho limitado. 
El componente `ExcelTemplateDownloader` está programado con `flex-row` (en fila) y la lista desplegable tiene un ancho fijo (`w-48`). Al sumar el ancho del botón "Descargar", se desborda y se sale de la caja verde hacia la derecha.

## 2. Solución Propuesta
Dado que este componente solo se usa en esta pantalla lateral, la mejor forma de integrarlo es **apilando los elementos verticalmente** para que se adapten al 100% del ancho disponible de su contenedor verde.

### Cambios en `src/components/admin/ExcelTemplateDownloader.tsx`:
1. Cambiar el contenedor principal de `flex-row` a `flex-col` (columna).
2. Quitar el ancho fijo `w-48` del menú desplegable y cambiarlo por `w-full`.
3. Hacer que el botón "Descargar Plantilla" también ocupe todo el ancho (`w-full`) y centrar su contenido.

## 3. Resultado Esperado
- El menú de selección de categoría aparecerá arriba, ocupando el ancho de la cajita verde.
- El botón de descargar aparecerá justo debajo, también del mismo ancho.
- Visualmente se verá como un "Widget" muy limpio y será 100% responsive en cualquier tamaño de pantalla. No afectará a ninguna otra función.
